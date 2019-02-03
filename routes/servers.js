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
        res.status(401).json(`Malformed ID ${req.params.id}`);
        return;
    }
    const guild = client.guilds.get(req.params.id);
    if(!guild || !guild.available) {
        res.status(404).json({ code: 1, error: 'Guild not found or it is unavailable' });
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
        res.status(401).json(`Malformed ID ${req.params.id}`);
        return;
    }
    const guild = client.guilds.get(req.params.id);
    if(!guild || !guild.available) {
        res.status(404).json({ code: 1, error: 'Guild not found or it is unavailable' });
        return;
    }
    guild.fetchMembers()
    .then((completeGuild) => {
        res.status(200).json(completeGuild.members.map((member) => {
            return {
                id: member.user.id,
                username: member.user.username,
                discriminator: member.user.discriminator,
                avatar: member.user.avatarURL,
                bot: member.user.bot,
            };
        }));

    })
    .catch((e) => {
        res.status(500).json({ code: 2, error: 'Internal server error' });
    });
});

module.exports = router;
