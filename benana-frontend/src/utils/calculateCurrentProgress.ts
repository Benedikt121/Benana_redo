import { SongInfo } from "@/types/MusicTypes";

export const calculateCurrentProgress = (currentSong: SongInfo | null) => {
  if (!currentSong) return 0;

  if (currentSong.playbackState === "PAUSED") return currentSong.timestamp;

  const timeSinceUpdate = Date.now() - currentSong.updatedAt;

  return Math.min(currentSong.timestamp + timeSinceUpdate, currentSong.length);
};
