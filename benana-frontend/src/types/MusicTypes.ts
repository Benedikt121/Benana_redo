export type MusicPlatform = "SPOTIFY" | "APPLE_MUSIC";
export type PlaybackState = "PLAYING" | "PAUSED";

export interface SongInfo {
  trackId?: string;
  title: string;
  artist: string;
  albumCoverUrl?: string | null;
  timestamp: number;
  playbackState: PlaybackState;
  platform: MusicPlatform;
  updatedAt: number;
  appleTrackId?: string | null;
  spotifyTrackId?: string | null;
}

export interface BackendSongInfo {
  trackId: string;
  trackName: string;
  artist: string;
  playbackState: PlaybackState;
  timestamp: number;
  platform: MusicPlatform;
  updatedAt: number;
  appleTrackId?: string | null;
  spotifyTrackId?: string | null;
  coverUrl?: string | null;
}
