const express = require('express');
const router = express.Router();

const { checkSnowflake } = require('../utils');

const client = require('../discord-interface');

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('All servers');
});

router.get('/:id', function(req, res, next) {
    if(!checkSnowflake(req.params.id)) {
        // TODO: Standardize error object + wrap error object
        res.status(401).json({
            type: 'internal',
            stage: 'gateway',
            message: `Malformed ID ${req.params.id}`,
            http_status: 401,
            previous: null,
        });
        return;
    }
    const guild = client.guilds.get(req.params.id);
    if(!guild || !guild.available) {
        // TODO: Standardize error object + wrap error object
        res.status(404).json({
            type: 'discord',
            stage: 'gateway',
            message: 'Guild not found or unavailable',
            http_status: 404,
            previous: null,
        });
        return;
    }
    res.status(200).json({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL,
    });
});

router.get('/:id/members', function(req, res, next) {
    if(!checkSnowflake(req.params.id)) {
        // TODO: Standardize error object + wrap error object
        res.status(401).json({
            type: 'internal',
            stage: 'gateway',
            message: `Malformed ID ${req.params.id}`,
            http_status: 401,
            previous: null,
        });
        return;
    }
    const guild = client.guilds.get(req.params.id);
    if(!guild || !guild.available) {
        // TODO: Standardize error object + wrap error object
        res.status(404).json({
            type: 'discord',
            stage: 'gateway',
            message: 'Guild not found or unavailable',
            http_status: 404,
            previous: null,
        });
        return;
    }
    guild.fetchMembers()
    .then((completeGuild) => {
        res.status(200).json(completeGuild.members.map((member) => {
            return {
                id: member.user.id,
                username: member.user.username,
                nickname: member.nickname,
                discriminator: member.user.discriminator,
                avatar: member.user.avatarURL,
                bot: member.user.bot,
            };
        }));
    })
    .catch((e) => {
        // TODO: Standardize error object + wrap error object
        res.status(500).json({
            type: 'discord',
            stage: 'gateway',
            message: 'Internal error while fetching members',
            http_status: 500,
            previous: e,
        });
    });
});

router.get('/:id/roles', function(req, res) {
    if(!checkSnowflake(req.params.id)) {
        // TODO: Standardize error object + wrap error object
        res.status(401).json({
            type: 'internal',
            stage: 'gateway',
            message: `Malformed ID ${req.params.id}`,
            http_status: 401,
            previous: null,
        });
        return;
    }
    const guild = client.guilds.get(req.params.id);
    if(!guild || !guild.available) {
        // TODO: Standardize error object + wrap error object
        res.status(404).json({
            type: 'discord',
            stage: 'gateway',
            message: 'Guild not found or unavailable',
            http_status: 404,
            previous: null,
        });
        return;
    }
    // Send back a list of roles
    const roles = guild.roles.map((role, id) => {
        return {
            id,
            color: role.hexColor,
            name: role.name,
        };
    });
    res.status(200).json(roles);
});

module.exports = router;
