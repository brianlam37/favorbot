const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database('./debts.db');

module.exports = {

    name: 'checkdebts',
    aliases: ['debts'],
    description: 'how many debts do you owe in this guild',
    guildOnly: true,
    execute(message, args) {
    	let selCount = `SELECT COUNT(*) count FROM debts WHERE userId = ? AND guildId = ?`;
		db.get(selCount,[message.author.id,message.guild.id],(err,row)=> {
			if (err) {
				return console.error(err.message);
			}
			if(row.count > 0 ){
				message.channel.send("You have " + row.count + " debts in " + message.guild.name);
			}else{
				message.channel.send("You have 0 debts in " + message.guild.name);
			}
		});
    },
};

