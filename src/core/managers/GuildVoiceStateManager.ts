import { Collection, Snowflake } from "discord.js";
import { GuildVoiceState } from "../voice";

export const guildVoiceStateManager = new Collection<
    Snowflake,
    GuildVoiceState
>();
