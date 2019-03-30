const replies = require("./yes.json");
const sqlite3 = require("sqlite3").verbose();
let db = new sqlite3.Database('./debts.db');

module.exports = {
    name: 'resolve',
    aliases: ['payback','repay'],
    description: 'pay back a person',
    guildOnly: true,
    execute(message, args) {

    	if (!message.mentions.users.size) {
	        message.channel.send('You need to mention a user!');
	    }else if(!message.mentions.users.size>1){
	    	message.channel.send('One at a time!');
	    }else{
	    	//orig is the author of message, using message.member to get nickname, instead of author which would display username
		    const orig = message.member;
		    //asked is the person asked to give a favor
	    	const asked = message.mentions.members.first();
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
			//Array of index of the debtIdArr
			let debtArr = [];
			//Array of each debtID
			let debtIdArr = [];
			//Using a string to hold all the debts to make it sent in one message instead of multiple
			let msgstr = "";
			//SQL statement the gets the debt's id in the datatable and the reason for the debt where the author is the person who asked for a favor
			let selDebt = `SELECT debtID, reason FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ? AND UdebtorId = ? AND LdebtorId = ?`;
			//Function made to call things in order, before things would be called out of order causing it to not work
			//in the end this function wasn't required, but I left it anyways
			function debtsTo(sql){
				//iterator that acts as the index of the debtArr
				let iter = 0;	
				//Run SQL on the database,call resolve function afterwards to have things in order
				db.each(sql, [upUser,loUser,upGuild,loGuild,upDebt,loDebt], function (err, row){
							if (err) {
								throw err;
							}
							//Concatenating the string
							msgstr+=`${iter}: Reason: _${row.reason}_\n`;
							debtArr.push(iter);
							debtIdArr[iter] = row.debtID;
							iter++;		
				},resolve);
			}
			//Function made as a call back so things would happen in an order
			function resolve(){
				//Booleans to check if a proper answer has been made
		    	//Yes checks if the asked person responds with yes or no
				let yes = false;
				//ans checks if a yes or no has been given
				let ans = false;
				//Variable that represents the chosen debt
				let chosen;
				//Filter through the debtArr, make sure the one answering is the one who started the command
				const filter = function ans(response){
					if(debtArr.some(answer => answer.toString() === response.content) && response.author.id === orig.id){
						//set chosen equal to the answer if it passes the filter
						chosen = parseInt(response.content);
						return true;
					}else{
						return false;
					}
				};
				message.channel.send(`Which one of these would you like to resolve? Type one of the numbers\n${msgstr} Only one may be resolved at a time, if none are chosen, this request will time out`).then(() => {
					//Wait for the filter to be passed otherwise time out
					message.channel.awaitMessages(filter,{
						time:15000,
						maxMatches: 1,
						errors:['time']
					}).then(() => {
						//If filter passed ask the mentioned user if they agree to resolve the debt
						message.channel.send(`<@${asked.id}> Do you agree? \nAnswer yes to help, ignore to refuse`).then(() => {
							//Check if they agree
							const filterY = response => {
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
							//Wait for their replay and if it passes this filter
							message.channel.awaitMessages(filterY,{
								time:15000,
								maxMatches: 1,
								errors:['time']
							}).then(() => {
								if(yes){
									//SQL statement that deletes from the datatable
									let del =`DELETE FROM debts WHERE debtID = ?`;
									//Delete the debt with debtID found in debtIdArr at chosen
									db.run(del,[debtIdArr[chosen]],function(err) {
										  if (err) {
										    return console.error(err.message);
										  }
										  message.channel.send('Debt cleared');
									});
								}else{
									//if they answered no
									message.channel.send(asked.displayName+` has rejected you <@${orig.id}>.`)									
								}
							}).catch((err)=>{
								message.channel.send(asked.displayName+` didn't notice you <@${orig.id}>.`);
							});
						});
					}).catch((err)=>{
						message.channel.send('Nothing Resolved');
					});
				});
			}
			//SQL statement the selects the amount of debts the user has to the person mentioned
	    	let selCount = `SELECT COUNT(*) count FROM debts WHERE UuserId = ? AND LuserId = ? AND UguildId = ? AND LguildId = ? AND UdebtorId = ? AND LdebtorId = ?`;
			db.get(selCount,[upUser,loUser,upGuild,loGuild,upDebt,loDebt],(err,row)=> {
				if (err) {
					return console.error(err.message);
				}
				if(row.count > 0 ){
	 				message.channel.send(`Debts owed to **${asked.displayName}**`);
	 				//Call the first function
	 				debtsTo(selDebt);
					
				}else{
					message.channel.send("You don't owe any debts to this person");
				}
			});
		}
    },
};