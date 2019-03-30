//Database module
const sqlite3 = require("sqlite3").verbose();
//Open database
let db = new sqlite3.Database('./debts.db');

module.exports = {
    name: 'checkdebts',
    aliases: ['debts'],
    description: 'how many debts do you owe in this guild and who you owe them to',
    guildOnly: true,
    execute(message, args) {
    	//Variables that will be used for the database
    	//Purpose of these this is that I had a problem getting large numbers stored in the database
    	//As a result I needed to split the id's into two pieces and store them separately, I chose to convert them to string
    	//Since I thought that was the easiest and most convenient way I could think of
    	//Take the message author's id and convert it to string
		const strUser = message.author.id.toString();
		//Take the guild's id and convert it to string
		const strGuild = message.guild.id.toString();
		//Upper half of the author's id
		const upUser = strUser.substring(0,strUser.length/2);
		//Lower half of the author's id
		const loUser = strUser.substring(strUser.length/2);
		//Upper half of the guild's id
		const upGuild = strGuild.substring(0,strGuild.length/2);
		//Lower half of the guild's id
		const loGuild = strGuild.substring(strGuild.length/2);
		//SQL statment the selects the number of debts a user has in this guild
    	let selCount = `SELECT COUNT(*) count FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ?`;
    	//Run the sql database on this statement
		db.get(selCount,[upUser,loUser,upGuild,loGuild],(err,row)=> {
			if (err) {
				return console.error(err.message);
			}
			//If the count is greater than 0
			if(row.count > 0 ){
				message.channel.send(`You have ***${row.count}*** debts in **${message.guild.name}**`);
				//SQL statement that selects the id of the people the user owes in this guild and why
				let sql = `SELECT UdebtorId, LdebtorId, reason FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ?`;
 				//For each person that the user owes, display their username and what the user owes them for
				db.each(sql, [upUser,loUser,upGuild,loGuild], (err, row) => {
					if (err) {
						throw err;
					}
						//Search through the guild for every member to pull out their username
						message.guild.members.forEach((member)=>{
							//Get their id and convert to string
							var strMem = member.user.id.toString();
							//Split upper and lower
							var upMem = strMem.substring(0,strMem.length/2);
							var loMem = strMem.substring(strMem.length/2);
							//If their id's match then message that they are owed for what reason
							if(upMem === row.UdebtorId && loMem === row.LdebtorId){
								message.channel.send(`You owe **${member.displayName}** for _${row.reason}_`);
							}
						});	
				});
			}else{
				message.channel.send(`You have ***0*** debts in **${message.guild.name}**`);
			}
		});
    },
};

