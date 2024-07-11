import { Collection } from "discord.js";

export const cooldowns = new Collection<bigint, Collection<string, number>>();
