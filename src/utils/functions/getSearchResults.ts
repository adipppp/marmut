import { getVideoId } from "./getVideoId";
import { getLavalinkClient } from "../../core/client";
import { LavalinkErrorCode } from "../../enums";
import { LavalinkError } from "../../errors";

export async function getSearchResults(query: string) {
    const lavalinkClient = getLavalinkClient();
    const node = lavalinkClient.options.nodeResolver(lavalinkClient.nodes);
    if (node === undefined) {
        throw new LavalinkError({
            code: LavalinkErrorCode.NO_AVAILABLE_NODES,
        });
    }
    let identifier;
    const videoId = getVideoId(query);
    if (videoId !== null) {
        identifier = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
        identifier = `ytsearch:${query}`;
    }
    const response = await node.rest.resolve(identifier);
    return response;
}
