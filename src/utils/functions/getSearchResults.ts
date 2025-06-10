import { getVideoId } from "./getVideoId";
import { lavalinkClient } from "../../core/client";
import { LavalinkErrorCode } from "../../enums";
import { LavalinkError } from "../../errors";

export async function getSearchResults(query: string) {
    const node = lavalinkClient.options.nodeResolver(lavalinkClient.nodes);
    if (node === undefined) {
        throw new LavalinkError({
            code: LavalinkErrorCode.NO_AVAILABLE_NODES,
        });
    }
    let identifier;
    const videoId = getVideoId(query);
    if (videoId !== null) {
        identifier = videoId;
    } else {
        identifier = `ytsearch:${query}`;
    }
    const response = await node.rest.resolve(identifier);
    return response;
}
