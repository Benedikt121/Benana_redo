export type MusicPlatform = "spotify" | "apple_music" | "none";

export interface SongInfo {
  id?: string;
  title: string;
  artist: string;
  albumCoverUrl: string | null;
  timestamp: number;
  isPlaying: boolean;
  platform: MusicPlatform;
  updatedAt: number;
}
