const ytHostnames = new Set(["www.youtube.com", "youtube.com", "youtu.be"]);

export function getVideoId(input: string) {
    let url;
    try {
        url = new URL(input);
    } catch {
        return null;
    }

    if (
        (url.protocol !== "http:" && url.protocol !== "https:") ||
        !ytHostnames.has(url.hostname)
    ) {
        return null;
    }

    if (url.hostname === "youtu.be") {
        return url.pathname.split("/")[1];
    } else {
        return url.searchParams.get("v");
    }
}
