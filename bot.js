
//Include modules
const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');
const sqlite3 = require('sqlite3').verbose();

const client = new Discord.Client();
client.commands = new Discord.Collection();
//Read commands file and looks for files ending with .js ie JavaScript commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
const cooldowns = new Discord.Collection();
let db = new sqlite3.Database('./debts.db');
//Tell's me the bot is up
client.on('ready', () => {
    console.log('Ready!');
    db.run("CREATE TABLE IF NOT EXISTS debts (debtID INTEGER PRIMARY KEY, UuserId TEXT,LuserId TEXT, UguildId TEXT, LguildId TEXT, UdebtorId TEXT, LdebtorId TEXT, reason TEXT)");
    console.log('Table Made!')
});

client.on('message', message => {
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (!timestamps.has(message.author.id)) {
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }
    else {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    try {
        command.execute(message, args);
    }
    catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }

});

client.login(token);