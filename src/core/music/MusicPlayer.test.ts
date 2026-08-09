import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { MusicPlayer } from './MusicPlayer';
import { Player } from 'shoukaku';
import { RepeatMode } from '../../enums';
import { Song } from './Song';
import { getLavalinkClient, getMarmutClient } from '../client/LavalinkClient';

// Mock Player and LavalinkClient
vi.mock('shoukaku', async () => {
    const actual = await vi.importActual('shoukaku');
    return {
        ...actual as any,
        Player: vi.fn(),
    };
});
vi.mock('../client/LavalinkClient', () => ({
    getLavalinkClient: vi.fn(),
    getMarmutClient: vi.fn()
}));

describe('MusicPlayer', () => {
    let musicPlayer: MusicPlayer;
    let mockPlayer: Player;

    beforeEach(() => {
        mockPlayer = {
            setGlobalVolume: vi.fn(),
            on: vi.fn(),
            playTrack: vi.fn(),
            stopTrack: vi.fn(),
            setPaused: vi.fn(),
            seekTo: vi.fn(),
            paused: false,
        } as unknown as Player;
        
        // Mock LavalinkClient to return our mockPlayer
        const mockLavalink = { players: new Map([['guild-1', mockPlayer]]) };
        (getLavalinkClient as Mock).mockReturnValue(mockLavalink as any);
        
        musicPlayer = new MusicPlayer('guild-1', mockPlayer);
    });

    it('should correctly increment index in Normal mode', () => {
        (musicPlayer as any).songs = [
            new Song({ title: 'A', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encA' }),
            new Song({ title: 'B', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encB' })
        ];
        (musicPlayer as any).currentIndex = 0;
        
        expect((musicPlayer as any).getNextIndex()).toBe(1);
    });

    it('should loop index in Queue mode', () => {
        (musicPlayer as any).songs = [
            new Song({ title: 'A', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encA' }),
            new Song({ title: 'B', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encB' })
        ];
        (musicPlayer as any).currentIndex = 1;
        musicPlayer.setRepeatMode(RepeatMode.Queue);
        
        expect((musicPlayer as any).getNextIndex()).toBe(0);
    });

    it('should maintain index in Song mode', () => {
        (musicPlayer as any).songs = [
            new Song({ title: 'A', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encA' })
        ];
        (musicPlayer as any).currentIndex = 0;
        musicPlayer.setRepeatMode(RepeatMode.Song);
        
        expect((musicPlayer as any).getNextIndex()).toBe(0);
    });

    it('should seek to position in milliseconds', async () => {
        (musicPlayer as any).songs = [
            new Song({ title: 'A', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encA' })
        ];
        (musicPlayer as any).currentIndex = 0;
        
        await musicPlayer.seek(5000);
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(5000);
    });

    it('should return true for isPlaying even when paused', () => {
        (musicPlayer as any).songs = [
            new Song({ title: 'A', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encA' })
        ];
        (musicPlayer as any).currentIndex = 0;
        mockPlayer.paused = true;
        
        expect(musicPlayer.isPlaying()).toBe(true);
    });

    it('should clear songs when queue naturally ends', async () => {
        (musicPlayer as any).songs = [
            new Song({ title: 'A', thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: 'encA' })
        ];
        (musicPlayer as any).currentIndex = 0;
        
        await (musicPlayer as any).handlePlayerEnd();
        
        expect((musicPlayer as any).currentIndex).toBe(-1);
        expect((musicPlayer as any).songs.length).toBe(0);
    });

    it('should truncate history beyond MAX_HISTORY in normal mode', () => {
        const dummySongs = Array.from({ length: 105 }, (_, i) => 
            new Song({ title: `S${i}`, thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: `enc${i}` })
        );
        (musicPlayer as any).songs = dummySongs;
        (musicPlayer as any).currentIndex = 102; // exceeds 100
        
        (musicPlayer as any).cleanupHistory();
        
        expect((musicPlayer as any).songs.length).toBe(103); // deleted 2 songs (102 - 100)
        expect((musicPlayer as any).currentIndex).toBe(100);
    });

    it('should NOT truncate history when RepeatMode is Queue', () => {
        const dummySongs = Array.from({ length: 105 }, (_, i) => 
            new Song({ title: `S${i}`, thumbnailUrl: '', videoUrl: '', duration: 10000n, encoded: `enc${i}` })
        );
        (musicPlayer as any).songs = dummySongs;
        (musicPlayer as any).currentIndex = 102;
        musicPlayer.setRepeatMode(RepeatMode.Queue);
        
        (musicPlayer as any).cleanupHistory();
        
        expect((musicPlayer as any).songs.length).toBe(105);
        expect((musicPlayer as any).currentIndex).toBe(102);
    });
});
