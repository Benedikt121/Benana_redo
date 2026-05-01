import { useState, useEffect } from "react";
import { useMusicStore } from "@/store/music.store";
import { calculateCurrentProgress } from "@/utils/calculateCurrentProgress";

export const useMusicProgress = () => {
  const currentSong = useMusicStore((state) => state.currentSong);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!currentSong) {
      setProgress(0);
      return;
    }

    // Initial set
    setProgress(calculateCurrentProgress(currentSong));

    if (currentSong.playbackState === "PLAYING") {
      const interval = setInterval(() => {
        setProgress(calculateCurrentProgress(currentSong));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [currentSong]);

  return progress;
};
