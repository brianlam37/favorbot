//Include modules
//Read the from command folder
const fs = require('fs');
//The whole reason why this bot works
const Discord = require('discord.js');
//Secret stuff
const { prefix, token } = require('./config.json');
//Database module
const sqlite3 = require('sqlite3').verbose();
const client = new Discord.Client();
//Collection of commands
client.commands = new Discord.Collection();
//Read commands file and looks for files ending with .js ie JavaScript commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    //Adds these to the commands folder
    client.commands.set(command.name, command);
}
//Collection of commands with cooldowns
const cooldowns = new Discord.Collection();
//Open the database
let db = new sqlite3.Database('./debts.db');
//Tells me the bot is up
client.on('ready', () => {
    console.log('Ready!');
    //On bot run, if the table doesn't exist, make it with these attributes
    db.run("CREATE TABLE IF NOT EXISTS debts (debtID INTEGER PRIMARY KEY, UuserId TEXT,LuserId TEXT, UguildId TEXT, LguildId TEXT, UdebtorId TEXT, LdebtorId TEXT, reason TEXT)",()=>{
        console.log('Table Made!');
    });
    
});
//When the cliet receives messages
client.on('message', message => {
    //If the message did start with the prefix run any commands
    if(message.content.startsWith(prefix)){
        //Code adapted from Discord.js Guide
        //Get arguments from the message and remove the prefix
        const args = message.content.slice(prefix.length).split(/ +/);
        //Remove the first argument from the argument arg array as the commandName, lower case for ease of use
        const commandName = args.shift().toLowerCase();
        //Look in the commands folder for any commands that equal commandName, or if they equal the aliases of the commandName
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        //If not a command return and do nothing
        if (!command) return;
        //If the commandname isn't in the cooldown collection add it
        if (!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection());
        }
        //Current time
        const now = Date.now();
        //If command name was called from cooldowns
        const timestamps = cooldowns.get(command.name);
        //Calculate time in milliseconds of the command's cooldown, if not provided one, default is 3
        const cooldownAmount = (command.cooldown || 3) * 1000;
        //If this is the first time the message author has use a command, put them in a set where they need to wait for cooldownAmount before they can use the command again
        if (!timestamps.has(message.author.id)) {
            timestamps.set(message.author.id, now);
            setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        }
        else {
            //If the author is still in the time out list warn them about how long they have until the command is available again
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
    }
});

client.login(token);