import { Collection } from "discord.js";

export const cooldowns = new Collection<string, Collection<string, number>>();
