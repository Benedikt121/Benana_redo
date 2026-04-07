export const QUERY_KEYS = {
  AUTH: {
    LOGIN: ["auth", "login"] as const,
    USER: ["auth", "user"] as const,
  },
  MUSIC: {
    APPLE_MUSIC_TRACK: (trackId: string) => ["track", "appleMusic", trackId] as const,
    SPOTIFY_TRACK: (trackId: string) => ["track", "spotify", trackId] as const,
  }
};
