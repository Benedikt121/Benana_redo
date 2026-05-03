export type MusicPlatform = "SPOTIFY" | "APPLE_MUSIC";
export type PlaybackState = "PLAYING" | "PAUSED";
export type RepeatMode = "off" | "one" | "all";

export interface SongInfo {
  trackId?: string;
  title: string;
  artist: string;
  albumCoverUrl?: string | null;
  timestamp: number;
  playbackState: PlaybackState;
  length: number;
  platform: MusicPlatform;
  updatedAt: number;
  appleTrackId?: string | null;
  spotifyTrackId?: string | null;
}

export interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  artworkUrl?: string;
  durationMs: number;
}

export interface BackendSongInfo {
  trackId: string;
  trackName: string;
  artist: string;
  playbackState: PlaybackState;
  length: number;
  timestamp: number;
  platform: MusicPlatform;
  updatedAt: number;
  appleTrackId?: string | null;
  spotifyTrackId?: string | null;
  coverUrl?: string | null;
}
