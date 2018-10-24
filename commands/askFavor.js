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
					const strUser = message.author.id.toString();
					const strGuild = message.guild.id.toString();
					const strAsked = asked.id.toString();
					const upUser = strUser.substring(0,strUser.length/2);
					const loUser = strUser.substring(strUser.length/2);
					const upGuild = strGuild.substring(0,strGuild.length/2);
					const loGuild = strGuild.substring(strGuild.length/2);
					const upDebt = strAsked.substring(0,strAsked.length/2);
					const loDebt = strAsked.substring(strAsked.length/2);
					db.run("INSERT INTO debts (UuserId, LuserId, UguildId, LguildId, UdebtorId, LdebtorId, reason) VALUES (?, ?, ?, ?, ?, ?, ?)", [upUser, loUser,upGuild, loGuild, upDebt, loDebt, reeson]);
				}).catch((err)=>{
					message.channel.send(asked.displayName+` didn't notice you <@${orig.id}>.`);
				});
			});

	    }

    },
};


