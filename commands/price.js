const Discord = require("discord.js");
const regionals = require("../assets/regions.json");
// Add the filesystem
const fs = require('fs');
module.exports = {
	name: 'price',
	// Timer to avoid Spam, Useful with API's
	cooldown: 5,
	description: 'Command to get market price data',
	run(bot, message, args){
		try{
			// Define User
			let user = message.author.username;
			// Define Channels to be used:
			const mark = bot.channels.get("630090190790066196");	// Market Request Channel
			// Only accept requests in market channel
				if (message.channel != mark) {
					return;
				}
			// get the sales sheet
			fs.readFile('./scraped_files/current_sales.json',
				// callback function that's called when reading a file is done!
				async function(err, data) {
					if (err) {
						throw err;
					}
					// json data
					let salesInfo = data;
					// parse Json file
					let sales = JSON.parse(salesInfo);
					// set the loop area
					let salesSheet = sales.data;
					// Sort by coin price Lowest - Highest
					let sortData = salesSheet;
					sortData.sort(function(a, b){
						return b.Quality - a.Quality;
					});
					const initiate = findItem(sortData);
					await initiate;
				});		

			// Get Item from input;
			async function response(sortedData){
				const filter = m => sortedData.filter(respond => m.content.includes(respond.Name));
				const collector = await message.channel.awaitMessages(filter, {time: 10000, max: 1});
				return collector.first().content;
			}

			// Embed Builder
			function buildembOutput(item, user, page, pages, itemName){
				const embOutput = new Discord.RichEmbed()
					.setColor('#1eb7d9')
					.setTitle(`Market Price for ${itemName}`)
					.setDescription(`${user}`)
					.addField(`__Item:__`, item.Name)
					.addField(`__Quality:__`, item.Quality)
					.addField(`__Quantity:__`, item.Quantity)
					.addField(`__Price:__`, item.CoinPrice)
					.addField(`__Tradepost__`, item.TradePostName)
					.setThumbnail('https://i.imgur.com/hmWTeKv.png')
					.setFooter(` Page ${page} of ${pages} || © LIF Helper Bot - 2019 `);
					return embOutput;
			}

			// Output
			async function outputRecord(responded, itemName){
				// Define the amount of pages needed
				const pages = responded.length;
				// Default first page to 1
				let page = 1;
				// Loop first Array
				for (let i = 0; i < responded.length; i++){
					// Grab first array length
					const item = responded[i];
						if (i == page-1){
								// Build message
								let embOutput = buildembOutput(item, user, page, pages, itemName);
								// Send message
								message.channel.send(embOutput).then(msg => {
									// Add reactions
									msg.react('◀').then( r => {
										msg.react('▶')
									// Filters
									const prevFilter = (reaction, user) => reaction.emoji.name === '◀' && user.id === message.author.id;
									const nextFilter = (reaction, user) => reaction.emoji.name === '▶' && user.id === message.author.id;
									// Collectors
									const previous = msg.createReactionCollector(prevFilter);
									const next = msg.createReactionCollector(nextFilter);
									// Manage Collections
									previous.on('collect', r => {
								if (page === 1) return; // If on first page, disable going back!
									page--; // Not on first page, go back
									embOutput = buildembOutput(responded[page-1], user, page, pages, itemName);
									msg.edit(embOutput);
									// removes reaction
									r.remove(r.users.filter(u => u === message.author).first());
								})
								next.on('collect', r => {
									if (page === pages) return; // If on last page, disable going forwards!
									page++; // Not on last page, go forward
									embOutput = buildembOutput(responded[page-1], user, page, pages, itemName);
									msg.edit(embOutput);
									// Remove reactions
									r.remove(r.users.filter(u => u === message.author).first());
								})
							})
						});
					}
				}
			}

			// User Input for Searching
			async function findItem(sortData){
				const sortedData = sortData;
				await message.channel.send("What Item do you want the market details on?");
				const itemName = await response(sortedData);
				filteredName = sortedData.filter(response => itemName.includes(response.Name));
				let responded = await filteredName.map(response => (response));
				const output = await outputRecord(responded, itemName);
				output;
			}

		}catch (error) {
			console.error(error);
		}
	}		
}