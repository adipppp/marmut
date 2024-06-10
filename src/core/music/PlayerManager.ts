import { Collection, Snowflake } from "discord.js";
import { MusicPlayer } from "./MusicPlayer";

export const musicPlayers = new Collection<Snowflake, MusicPlayer>();
