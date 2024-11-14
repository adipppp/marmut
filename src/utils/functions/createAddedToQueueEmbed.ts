import { Colors, EmbedBuilder } from "discord.js";
import { Song } from "../../core/music";

const MARMUT_ICON_40PX = process.env.MARMUT_ICON_40PX;

export function createAddedToQueueEmbed(song: Song) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTimestamp()
        .setThumbnail(song.thumbnailUrl)
        .setFooter({ text: "Marmut", iconURL: MARMUT_ICON_40PX })
        .setDescription(
            `:white_check_mark:  -  Added to queue\n[${song.title}](${song.videoUrl})`
        );
}
