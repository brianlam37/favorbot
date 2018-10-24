const replies = require("./yes.json");
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database('./debts.db');

module.exports = {

    name: 'resolve',
    description: 'pay back a person',
    guildOnly: true,
    execute(message, args) {
    	if (!message.mentions.users.size) {
	        message.channel.send('You need to mention a user!');
	    }else if(!message.mentions.users.size>1){
	    	message.channel.send('One at a time!');
	    }else{
		    const orig = message.member;
	    	const asked = message.mentions.members.first();
			const strUser = message.author.id.toString();
			const strGuild = message.guild.id.toString();
			const strAsked = asked.id.toString();
			const upUser = strUser.substring(0,strUser.length/2);
			const loUser = strUser.substring(strUser.length/2);
			const upGuild = strGuild.substring(0,strGuild.length/2);
			const loGuild = strGuild.substring(strGuild.length/2);
			const upDebt = strAsked.substring(0,strAsked.length/2);
			const loDebt = strAsked.substring(strAsked.length/2);
			let debtArr = [];
			let debtIdArr = [];
			let msgstr = "";
			let sql = `SELECT debtID, reason FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ? AND UdebtorId = ? AND LdebtorId = ?`;
			function debtsTo(sql,callback){
				let iter = 0;	
				db.each(sql, [upUser,loUser,upGuild,loGuild,upDebt,loDebt], function (err, row){
							if (err) {
								throw err;
							}
							msgstr+=`${iter}: Reason: _${row.reason}_\n`;
							debtArr.push(iter);
							debtIdArr[iter] = row.debtID;
							iter++;		
				},resolve);
			}
			function resolve(){
				let chosen;
				const filter = function ans(response){
					if(debtArr.some(answer => answer.toString() === response.content) && response.author.id === orig.id){
						chosen = parseInt(response.content);
						return true;
					}else{
						return false;
					}
				};
				message.channel.send(`Which of these would you like to resolve?\n${msgstr}`).then(() => {
					message.channel.awaitMessages(filter,{
						time:15000,
						maxMatches: 1,
						errors:['time']
					}).then(() => {
						message.channel.send(`<@${asked.id}>Do you agree? \nAnswer yes to help, ignore to refuse`).then(() => {
							const filterY = response => {
								return replies.Yes.some(answer => answer.toLowerCase() === response.content.toLowerCase()) && response.author.id === asked.id;
							};
							message.channel.awaitMessages(filterY,{
								time:15000,
								maxMatches: 1,
								errors:['time']
							}).then(() => {
								let del =`DELETE FROM debts WHERE debtID = ?`;
								db.run(del,[debtIdArr[chosen]],function(err) {
									  if (err) {
									    return console.error(err.message);
									  }
									  message.channel.send('Debt cleared');
								});
							}).catch((err)=>{
								message.channel.send(asked.displayName+` didn't notice you <@${orig.id}>.`);
							});
						});
					}).catch((err)=>{
						message.channel.send('Nothing Resolved');
					});
				});
			}
	    	let selCount = `SELECT COUNT(*) count FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ? AND UdebtorId = ? AND LdebtorId = ?`;
			db.get(selCount,[upUser,loUser,upGuild,loGuild,upDebt,loDebt],(err,row)=> {
				if (err) {
					return console.error(err.message);
				}
				if(row.count > 0 ){
	 				message.channel.send(`Debts owed to **${asked.displayName}**`);
	 				debtsTo(sql,resolve);
					
				}else{
					message.channel.send("You don't owe any debts to this person");
				}
			});
		}
    },
};