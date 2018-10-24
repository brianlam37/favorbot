const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database('./debts.db');

module.exports = {

    name: 'checkdebts',
    aliases: ['debts'],
    description: 'how many debts do you owe in this guild',
    guildOnly: true,
    execute(message, args) {
		const strUser = message.author.id.toString();
		const strGuild = message.guild.id.toString();
		const upUser = strUser.substring(0,strUser.length/2);
		const loUser = strUser.substring(strUser.length/2);
		const upGuild = strGuild.substring(0,strGuild.length/2);
		const loGuild = strGuild.substring(strGuild.length/2);
    	let selCount = `SELECT COUNT(*) count FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ?`;
		db.get(selCount,[upUser,loUser,upGuild,loGuild],(err,row)=> {
			if (err) {
				return console.error(err.message);
			}
			if(row.count > 0 ){
				message.channel.send(`You have ${row.count} debts in **${message.guild.name}**`);
				let sql = `SELECT UdebtorId, LdebtorId, reason FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ?`;
 
				db.each(sql, [upUser,loUser,upGuild,loGuild], (err, row) => {
					if (err) {
						throw err;
					}
						message.guild.members.forEach((member)=>{
							var strMem = member.user.id.toString();
							var upMem = strMem.substring(0,strMem.length/2);
							var loMem = strMem.substring(strMem.length/2);
							if(upMem === row.UdebtorId && loMem === row.LdebtorId){
								message.channel.send(`You owe **${member.displayName}** for _${row.reason}_`);
							}
						});	
				});
			}else{
				message.channel.send("You have 0 debts in " + message.guild.name);
			}
		});
    },
};

