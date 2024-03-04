// Require the necessary discord.js classes
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');
// Require Node.js filesystem and path properties to be able to read directories and identify files. path helps construct paths to access files and directories. One of the advantages of the path module is that it automatically detects the operating system and uses the appropriate joiners.
const fs = require('node:fs');
const path = require('node:path');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

client.commands = new Collection;

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	client.user.setPresence({ activities: [{name: 'Wynning! .say to make me talk', type: ActivityType.Custom }], status: 'dnd'}); //Sets the bot's activity, such as playing, watching, etc. Need to import "ActivityType" from discord.js to change the type.
});

// Log in to Discord with your client's token
client.login(token);


const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {  //for loop to get the filepath of the commands files
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => { //using .on() method as listener for the interaction. The interaction is "Events.InteractionCreate" then execute the specified function
	if (interaction.isChatInputCommand()) { //if statement to check if the interaction received by the bot is a slash command. If it is not, just exit the function
		const command = interaction.client.commands.get(interaction.commandName); //this finds the command that was inputted by the user. "interaction.client" lets you use the Client instance. .commands is the collection created earlier which holds the commands. .get() is a method provided by the Collections imported class used to find the command. We pass the interaction.commandName property to this method to find the command name https://discordjs.guide/creating-your-bot/command-handling.html#executing-commands
		if (!command) /* falsy condition, if the command provided is not in the client.commands collection it will be falsy and execute this block. */ {
			console.log(`${command} was not found in the commands collection`);
		}
		try {
			await command.execute(interaction); 
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({content: "There was an error while executing this command.", ephemeral: true,})
			} else {
				await interaction.reply({content: "There was an error while executing this command.", ephemeral: true,})
			}
		}
	}
} );

client.on('messageCreate', (interaction) => {
	if (interaction.author.bot) return;
	if (interaction.content.toLowerCase().startsWith('.say ', 0)) { //if message starts with '.say' it sends whatever the content of the message is and deletes the original .say message by the user
		interaction.channel.send(interaction.content.replace(/.say/gi, ''));
		console.log(`Sent "${interaction.content.replace(/.say/gi, '')}" by ${interaction.author.globalName} to #${interaction.channel.name} in ${interaction.guild.name}`);
		interaction.delete();
		return;
	}
	if (fs.existsSync(path.join(__dirname, 'guild-data', interaction.guild.id, 'responses.json'))) {
		const readData = JSON.parse(fs.readFileSync(path.join(__dirname, 'guild-data', interaction.guild.id, 'responses.json')));
		const matchIndexes = [];
		readData.forEach( (el, index) => {
			if (interaction.content.toLowerCase().includes(el.message)) {
				matchIndexes.push(index)
			}
		} )
		for (let i=0;i<matchIndexes.length;i++) {
			if (readData[matchIndexes[i]].type === 'emoji') {
				interaction.react(readData[matchIndexes[i]].response)
			} else if (readData[matchIndexes[i]].type === 'text-reply') {
				interaction.reply(readData[matchIndexes[i]].response)
			}
		}
	}
})

// let previousAvatar;
// let intervalId;

// const avatarInterval = () => {
// 	intervalId = setInterval(randomAvatarCycling, 600000);
// }

// function randomAvatarCycling() { //chooses an avatar from the folder at random and updates it
		
// 	new Promise((resolve, reject) => {
// 		const avatarsPath = path.join(__dirname, '\\avatars\\');
// 		const avatarFiles = fs.readdirSync(avatarsPath);
// 		const avatarFilenames= [];
// 		for (avatar in avatarFiles) {
// 			const filePath = avatarsPath + avatarFiles[avatar];
// 			avatarFilenames.push(filePath)
// 		}

// 		const randomAvatar = avatarFilenames[Math.floor(Math.random() * avatarFilenames.length)];

// 		// console.log(`previousAvatar value before this cycle if = ${previousAvatar}`);
// 		if (previousAvatar !== randomAvatar) {
// 			client.user.setAvatar(randomAvatar)
// 			.then(() => resolve())
// 			.catch((error) => {
// 				if (error.code === 50035) {
// 					console.error(`Rate limit exceeded, retrying in 10 minutes... \nError code: ${error.code}`);
// 					clearInterval(intervalId);
// 					setTimeout(() => {
// 						avatarInterval();
// 					}, 600000);
// 					resolve();
// 				} else {
// 				console.error(error);
// 				console.error(`Error code: ${error.code}`);
// 				reject();
// 				}
// 			});
// 			console.log(`Previous avatar: ${previousAvatar}`);
// 			previousAvatar = randomAvatar;
// 			console.log(`Avatar updated to ${randomAvatar}`);
// 		} else if (previousAvatar === randomAvatar) {
// 			console.log(`Not changing avatar, random was same as previous.\nChosen Avatar: ${randomAvatar}`);
// 		}
// 	})
// }

// avatarInterval();




