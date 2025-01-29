const ytHostnames = new Set(["www.youtube.com", "youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"]);

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

    const splittedPathname = url.pathname.split("/");

    if (url.hostname === "youtu.be") {
        return splittedPathname[1];
    }

    if (splittedPathname[1] === "shorts") {
        return splittedPathname[2];
    }

    return url.searchParams.get("v");
}
