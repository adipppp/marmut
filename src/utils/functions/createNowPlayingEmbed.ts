import { Colors, EmbedBuilder } from "discord.js";
import { Song } from "../../core/music";
import { env } from "../../config";

export function createNowPlayingEmbed(song: Song) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTimestamp()
        .setThumbnail(song.thumbnailUrl)
        .setFooter({ text: "Marmut", iconURL: env.ui.marmutIcon40px })
        .setDescription(
            `:arrow_forward:  -  Now Playing\n[${song.title}](${song.videoUrl})`,
        );
}
