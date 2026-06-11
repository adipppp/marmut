import { DURATION } from "../../config";

const { MAX_SONG_DURATION_MS } = DURATION;

export function millisecondsToHHMMSS(ms: number): string {
    if (!Number.isInteger(ms)) {
        throw new Error("milliseconds must be an integer");
    }

    if (ms > MAX_SONG_DURATION_MS) {
        throw new Error("Cannot convert more than 24 hours");
    }

    let seconds = Math.trunc(ms / 1000);
    let minutes = Math.trunc(seconds / 60);
    const hours = Math.trunc(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;

    const secondsString = seconds.toString().padStart(2, "0");
    const minutesString = minutes.toString().padStart(2, "0");

    if (hours > 0) {
        const hoursString = hours.toString().padStart(2, "0");
        return `${hoursString}:${minutesString}:${secondsString}`;
    }

    return `${minutesString}:${secondsString}`;
}
