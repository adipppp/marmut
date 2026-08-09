import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueueView } from "./QueueView";
import { MusicPlayer, Song } from "../core/music";

describe("QueueView", () => {
    let mockPlayer: any;
    let queueView: QueueView;

    beforeEach(() => {
        mockPlayer = {
            getQueue: vi.fn(),
            getCurrentIndex: vi.fn(),
            getCurrentSongPlayback: vi.fn().mockReturnValue(1000),
        };
        queueView = new QueueView(mockPlayer as unknown as MusicPlayer);
    });

    it("should base upcoming songs and pagination on remaining songs after currentIndex", async () => {
        const mockSongs = [
            new Song({ title: "Past Song 1", thumbnailUrl: "https://example.com/thumb.jpg", videoUrl: "", duration: 10000n, encoded: "enc1" }),
            new Song({ title: "Current Song", thumbnailUrl: "https://example.com/thumb.jpg", videoUrl: "", duration: 10000n, encoded: "enc2" }),
            new Song({ title: "Future Song 1", thumbnailUrl: "https://example.com/thumb.jpg", videoUrl: "", duration: 10000n, encoded: "enc3" }),
            new Song({ title: "Future Song 2", thumbnailUrl: "https://example.com/thumb.jpg", videoUrl: "", duration: 10000n, encoded: "enc4" }),
        ];

        mockPlayer.getQueue.mockResolvedValue(mockSongs);
        mockPlayer.getCurrentIndex.mockReturnValue(1); // "Current Song" is at index 1

        const embed = await queueView.getEmbed();
        const embedData = embed.toJSON();

        expect(embedData.title).toContain("Now Playing");
        expect(embedData.description).toContain("Current Song");

        // The fields should list Future Song 1 and Future Song 2, NOT Past Song 1
        expect(embedData.fields?.[0].value).toContain("1. [Future Song 1]");
        expect(embedData.fields?.[0].value).toContain("2. [Future Song 2]");
        expect(embedData.fields?.[0].value).not.toContain("Past Song 1");
    });
});
