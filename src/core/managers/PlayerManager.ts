import { Collection, Snowflake } from "discord.js";
import { MusicPlayer } from "../music";

export const musicPlayers = new Collection<Snowflake, MusicPlayer>();
