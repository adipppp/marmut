import { Connectors, Shoukaku } from "shoukaku";
import { marmut } from "./MarmutClient";

const nodeName = process.env.LAVALINK_NODE_NAME;
const nodeUrl = process.env.LAVALINK_NODE_URL;
const nodeAuth = process.env.LAVALINK_NODE_AUTH;

if (nodeName === undefined) {
    throw new Error("LAVALINK_NODE_NAME environment variable is undefined.");
}
if (nodeUrl === undefined) {
    throw new Error("LAVALINK_NODE_URL environment variable is undefined.");
}
if (nodeAuth === undefined) {
    throw new Error("LAVALINK_NODE_AUTH environment variable is undefined.");
}

const nodes = [{ name: nodeName, url: nodeUrl, auth: nodeAuth }];

export const lavalinkClient = new Shoukaku(
    new Connectors.DiscordJS(marmut),
    nodes
);

lavalinkClient.on("error", (name, error) => {
    console.error(error);
});
