import { useCallback } from "react";
import { useMusicStore } from "@/store/music.store";
import { musicPlayback } from "@/services/musicPlayback.service";

export function useMusicControls() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const preferedPlatform = useMusicStore((s) => s.preferedPlatform);

  const isPlaying = currentSong?.playbackState === "PLAYING";
  const hasSong = currentSong !== null;

  const play = useCallback(async () => {
    try {
      await musicPlayback.play();
    } catch (e) {
      console.error("Play failed:", e);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      await musicPlayback.pause();
    } catch (e) {
      console.error("Pause failed:", e);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    try {
      await musicPlayback.togglePlayPause();
    } catch (e) {
      console.error("Toggle play/pause failed:", e);
    }
  }, []);

  const skipNext = useCallback(async () => {
    try {
      await musicPlayback.skipNext();
    } catch (e) {
      console.error("Skip next failed:", e);
    }
  }, []);

  const skipPrevious = useCallback(async () => {
    try {
      await musicPlayback.skipPrevious();
    } catch (e) {
      console.error("Skip previous failed:", e);
    }
  }, []);

  return {
    currentSong,
    isPlaying,
    hasSong,
    preferedPlatform,
    play,
    pause,
    togglePlayPause,
    skipNext,
    skipPrevious,
  };
}
