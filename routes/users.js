const express = require('express');
const router = express.Router();

const { checkSnowflake } = require('../utils');

const client = require('../discord-interface');

router.get('/:id', function(req, res, next) {
    if(!checkSnowflake(req.params.id)) {
        res.status(401).json(`Malformed ID ${req.params.id}`);
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
        if(e.code && e.code < 20000) {
            res.status(404).json({ code: 1, error: e.message });
            return;
        }
        console.log(e);
        res.status(500).json({ code: 1, error: 'Internal Server Error' });
    });
});

router.get('/:id/servers', function(req, res, next) {
    if(!checkSnowflake(req.params.id)) {
        res.status(401).json(`Malformed ID ${req.params.id}`);
        return;
    }
    client.fetchUser(req.params.id.toString())
    .then((user) => {
        return Promise.all(client.guilds.map((guild) => {
            console.log(`Testing guild ${guild.name}`);
            return guild.fetchMember(user)
            .catch((e) => {
                if(e.code && e.code < 20000) { return; }
                console.log(e);
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
        if(e.code && e.code < 20000) {
            res.status(404).json({ code: 1, error: e.message });
            return;
        }
        console.log(e);
        res.status(500).json({ code: 1, error: 'Internal Server Error' });
    });
});

module.exports = router;
