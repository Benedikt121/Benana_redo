import { redisClient } from "../../config/redis.js";

export interface UserMusicState {
  trackId: string;
  trackName: string;
  artist: string;
  playbackState: "PLAYING" | "PAUSED";
  timestamp: number;
  platform: "SPOTIFY" | "APPLE_MUSIC";
  updatedAt: number;
  appleTrackId?: string | null;
  spotifyTrackId?: string | null;
  coverUrl?: string | null;
}

const USER_MUSIC_STATE_PREFIX = "user_music_state:";

export const setMusicState = async (
  userId: string,
  status: UserMusicState,
): Promise<void> => {
  try {
    await redisClient.set(
      `${USER_MUSIC_STATE_PREFIX}${userId}`,
      JSON.stringify(status),
      { expiration: { type: "EX", value: 600 } },
    );
  } catch (error) {
    console.error("Error setting music state in Redis", error);
    throw error;
  }
};

export const getMusicState = async (
  userId: string,
): Promise<UserMusicState | null> => {
  const data = await redisClient.get(`${USER_MUSIC_STATE_PREFIX}${userId}`);
  return data ? (JSON.parse(data) as UserMusicState) : null;
};

export const removeMusicState = async (userId: string): Promise<void> => {
  await redisClient.del(`${USER_MUSIC_STATE_PREFIX}${userId}`);
};
