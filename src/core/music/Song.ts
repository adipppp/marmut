import { SongData } from "../../types";

export class Song {
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    duration: number;

    constructor(data: SongData) {
        this.title = data.title;
        this.thumbnailUrl = data.thumbnailUrl;
        this.videoUrl = data.videoUrl;
        this.duration = data.duration;
    }
}
