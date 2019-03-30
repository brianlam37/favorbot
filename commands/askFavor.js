const replies = require("./yes.json");
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database('./debts.db');


module.exports = {
    name: 'askfavor',
    aliases: ['ask'],
    description: 'asking for a favor using mentions',
    guildOnly: true,
    cooldown: 25,
    execute(message, args) {
    	//Booleans to check if a proper answer has been made
    	//Yes checks if the asked person responds with yes or no
		let yes = false;
		//ans checks if a yes or no has been given
		let ans = false;
		//String to hold the reason for the favor
    	let reeson = '';
    	//Put together the reason from the args
    	for(let i = 1;i< args.length;i++){
    		reeson += (args[i]+' ');
    	}
    	//Check for a user
		if (!message.mentions.users.size) {
	        message.channel.send('You need to mention a user!');
	    //Only one user at a time
	    }else if(!message.mentions.users.size>1){
	    	message.channel.send('One user at a time!');
	   	}else if(args.length < 2){
	   	//Need a reason
	   		message.channel.send('Give a reason!');
	    }else{
			//orig is the author of message, using message.member to get nickname, instead of author which would display username
		    const orig = message.member;
		    //asked is the person asked to give a favor
	    	const asked = message.mentions.members.first();
	    	const filter = response => {
    			if(replies.Yes.some(answer => answer.toLowerCase() === response.content.toLowerCase()) && response.author.id === asked.id){
    				//if they answered in the yes category
    				yes = true;
    				ans = true;
    			}else if(replies.No.some(answer => answer.toLowerCase() === response.content.toLowerCase()) && response.author.id === asked.id){
    				//if they answered in the no category
    				yes = false;
    				ans = true;
    			}
    			return ans;
			};
			message.channel.send(`<@${asked.id}>, do you want to help ${orig.displayName}? \nAnswer yes to help, no to refuse`).then(() => {
				message.channel.awaitMessages(filter,{
					time:15000,
					maxMatches: 1,
					errors:['time']
				}).then((ans) => {
					//they answered yes then push everything to the database
					if(yes){ 
						message.channel.send(asked.displayName +` has decided to help you <@${orig.id}>.`);
				    	//Variables that will be used for the database
			    		//Purpose of these this is that I had a problem getting large numbers stored in the database
			    		//As a result I needed to split the id's into two pieces and store them separately, I chose to convert them to string
			    		//Since I thought that was the easiest and most convenient way
						//Author id converted to string
						const strUser = message.author.id.toString();
						//Guild id converted to string
						const strGuild = message.guild.id.toString();
						//Asked person id converted to string
						const strAsked = asked.id.toString();
						//Upper and Lower halves of each id respectfully
						const upUser = strUser.substring(0,strUser.length/2);
						const loUser = strUser.substring(strUser.length/2);
						const upGuild = strGuild.substring(0,strGuild.length/2);
						const loGuild = strGuild.substring(strGuild.length/2);
						const upDebt = strAsked.substring(0,strAsked.length/2);
						const loDebt = strAsked.substring(strAsked.length/2);
						//Run sql statement to insert						
						db.run("INSERT INTO debts (UuserId, LuserId, UguildId, LguildId, UdebtorId, LdebtorId, reason) VALUES (?, ?, ?, ?, ?, ?, ?)", [upUser, loUser,upGuild, loGuild, upDebt, loDebt, reeson]);
					}else{
						//if they answered no
						message.channel.send(asked.displayName+` has rejected you <@${orig.id}>.`)
					}
				}).catch((err)=>{
					//if they didn't respond
					message.channel.send(asked.displayName+` didn't notice you <@${orig.id}>.`);
				});
			});

	    }

    },
};


