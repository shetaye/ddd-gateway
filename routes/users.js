const express = require('express');
const router = express.Router();

const { checkSnowflake } = require('../utils');

const client = require('../discord-interface');

router.get('/:id', function(req, res, next) {
    if(!checkSnowflake(req.params.id)) {
        //TODO: Standardize error object + wrap error object
        res.status(401).json({
            type: 'internal',
            stage: 'gateway',
            message: `Malformed ID ${req.params.id}`,
            http_status: 401,
            previous: null,
        });
        return;
    }
    client.fetchUser(req.params.id.toString())
    .then((user) => {
        res.status(200).json({
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatarURL,
            bot: user.bot,
        });
    })
    .catch((e) => {
        //TODO: Standardize error object + wrap error object
        if(e.code && e.code < 20000) {
            res.status(404).json({
                type: 'discord',
                stage: 'gateway',
                message: `Could not fetch user ${req.params.id}`,
                http_status: 404,
                previous: null,
            });
            return;
        }
        res.status(500).json({
            type: 'internal',
            stage: 'gateway',
            message: `Internal error while fetching user ${req.params.id}`,
            http_status: 500,
            previous: e,
        });
    });
});

router.get('/:id/servers', function(req, res, next) {
    if(!checkSnowflake(req.params.id)) {
        //TODO: Standardize error object + wrap error object
        res.status(401).json({
            type: 'internal',
            stage: 'gateway',
            message: `Malformed ID ${req.params.id}`,
            http_status: 401,
            previous: null,
        });
        return;
    }
    client.fetchUser(req.params.id.toString())
    .then((user) => {
        return Promise.all(client.guilds.map((guild) => {
            return guild.fetchMember(user)
            .catch((e) => {
                /* Errors bubble to higher level catch */
                /* If error code is less than 20000, it's just a 404 */
                if(e.code && e.code < 20000) { return; }
            });
        }));
    })
    .then((members) => {
        const guildObjs = [];
        for(let i = 0; i < members.length; i++) {
            if(members[i]) {
                guildObjs.push({
                    id: members[i].guild.id,
                    name: members[i].guild.name,
                    icon: members[i].guild.iconURL,
                });
            }
        }
        res.status(200).json(guildObjs);
    })
    .catch((e) => {
        //TODO: Standardize error object + wrap error object
        if(e.code && e.code < 20000) {
            res.status(404).json({
                type: 'discord',
                stage: 'gateway',
                message: 'User not found',
                http_status: 404,
                previous: e,
            });
            return;
        }
        res.status(500).json({
            type: 'discord',
            stage: 'gateway',
            message: 'Internal server error while fetching servers',
            http_status: 500,
            previous: null,
        });
    });
});

router.get('/:id/boundaries', function(req, res, next) {
    const serverFetch = client.fetchUser(req.params.id.toString())
    .then((user) => {
        return Promise.all(client.guilds.map((guild) => {
            return guild.fetchMember(user)
            .catch((e) => {
                /* Errors bubble to higher level catch */
                /* If error code is less than 20000, it's just a 404 */
                if(e.code && e.code < 20000) { return; }
            });
        }));
    })
    .then((members) => {
        return members.map((member) => {
            return member.guild.id;
        });
    });
    const userFetch = new Promise((resolve, reject) => {
        const users = [];
        return client.fetchUser(req.params.id.toString())
        .then((user) => {
            return Promise.all(client.guilds.map((guild) => {
                // Check if user is in current guild
                // Similar to the above code, except it returns the id of the guild instead of the member
                return guild.fetchMember(user)
                .then((member) => {
                    console.log(`User is apart of ${member.guild.id}`)
                    return member.guild;
                })
                .catch((e) => {
                    /* Errors bubble to higher level catch */
                    /* If error code is less than 20000, it's just a 404 */
                    if(e.code && e.code < 20000) { return; }
                });
            }));
        })
        .then((guilds) => {
            // We now have a handle on a list of guilds that the user is apart of
            return Promise.all(guilds.map((guild) => {
                // Fetch the members for each guild
                return guild.fetchMembers()
                .then((g) => {
                    // List of members
                    return g.members;
                });
            }));
        })
        .then((guildMembers) => {
            // We now have a list of lists of members for each server
            guildMembers.map((members) => {
                members.map((member) => {
                    // After flattening + unrolling the nested arrays, push each id to the user list
                    users.push(member.id);
                });
            });
        })
        // Resolve when done
        .then(() => resolve(users))
        // Reject at error
        .catch((e) => reject(e));
    });
    return Promise.all([serverFetch, userFetch])
    .then(([servers, users]) => {
        res.status(200).json({
            id: req.params.id,
            server_ids: servers,
            user_ids: users,
        });
    })
    .catch((e) => {
        //TODO: Standardize error object + wrap error object
        if(e.code && e.code < 20000) {
            res.status(404).json({
                type: 'discord',
                stage: 'gateway',
                message: 'User not found',
                http_status: 404,
                previous: e,
            });
            return;
        }
        res.status(500).json({
            type: 'discord',
            stage: 'gateway',
            message: 'Internal server error while fetching servers',
            http_status: 500,
            previous: e,
        });
    });
});

module.exports = router;
