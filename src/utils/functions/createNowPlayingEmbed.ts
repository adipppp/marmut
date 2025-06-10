import { Colors, EmbedBuilder } from "discord.js";
import { Song } from "../../core/music";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export function createNowPlayingEmbed(song: Song) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTimestamp()
        .setThumbnail(song.thumbnailUrl)
        .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
        .setDescription(
            `:arrow_forward:  -  Now Playing\n[${song.title}](${song.videoUrl})`
        );
}
