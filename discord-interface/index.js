const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');

client.on('ready', () => console.log('Bot ready'));

fs.readFile('config.json', (err, data) => {
    if(err) throw err;
    const d = JSON.parse(data);
    client.login(d.discord.token);
});

module.exports = client;