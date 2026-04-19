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

// --- API Response Types (based on backend musicController) ---

/** GET /music/apple-token */
export interface AppleTokenResponse {
  token: string;
}

/** POST /music/apple-token/save */
export interface AppleTokenSaveResponse {
  status: "success" | "error";
  message: string;
}

/** POST /music/spotify/exchange */
export interface SpotifyExchangeResponse {
  access_token: string;
  expires_in: number;
}

/** GET /music/spotify/refresh */
export interface SpotifyRefreshResponse {
  access_token: string;
  expires_in: number;
}

/** GET /music/spotify/current — success (HTTP 200) */
export interface SpotifyCurrentSongResponse {
  success: true;
  data: BackendSongInfo;
}
