require("dotenv").config();
const { REST, Routes } = require("discord.js");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const rest = new REST().setToken(token);

const route = guildId 
    ? Routes.applicationGuildCommands(clientId, guildId) 
    : Routes.applicationCommands(clientId);

rest.put(route, { body: [] })
    .then(() => console.log(`Successfully deleted all ${guildId ? "guild" : "global"} application commands.`))
    .catch(console.error);
