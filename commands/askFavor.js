const replies = require("./yes.json");
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database('./debts.db');


module.exports = {
    name: 'askfavor',
    aliases: ['ask'],
    description: 'asking for a favor',
    guildOnly: true,
    cooldown: 25,
    execute(message, args) {

		
    	let reeson = '';
    	for(let i = 1;i< args.length;i++){
    		reeson += (args[i]+' ');
    	}
		if (!message.mentions.users.size) {
	        message.channel.send('You need to mention a user!');
	    }else if(!message.mentions.users.size>1){
	    	message.channel.send('One at a time!');
	   	}else if(args.length < 2){
	   		message.channel.send('Give a reason!');
	    }else{
	    	const orig = message.member;
	    	const asked = message.mentions.members.first();
	    	const filter = response => {
    			return replies.Yes.some(answer => answer.toLowerCase() === response.content.toLowerCase()) && response.author.id === asked.id;
			};
			message.channel.send(`<@${asked.id}>, do you want to help ${orig.displayName}? \nAnswer yes to help, ignore to refuse`).then(() => {
				message.channel.awaitMessages(filter,{
					time:15000,
					maxMatches: 1,
					errors:['time']
				}).then((ans) => {
					message.channel.send(asked.displayName +` has decided to help you <@${orig.id}>.`);
					db.run("INSERT INTO debts (userId, guildId, debtorId, reason) VALUES (?, ?, ?, ?)", [message.author.id, message.guild.id, asked.id, reeson]);
				}).catch((err)=>{
					message.channel.send(asked.displayName+` didn't notice you <@${orig.id}>.`);
				});
			});

	    }

    },
};


