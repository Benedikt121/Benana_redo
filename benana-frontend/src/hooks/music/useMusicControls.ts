import { useCallback } from "react";
import { useMusicStore } from "@/store/music.store";
import { musicPlayback } from "@/services/musicPlayback.service";
import { fetchCurrentSpotifySong } from "@/api/music.api";
import { mapBackendSongToSongInfo } from "@/hooks/sockets/useMusicSync";

export function useMusicControls() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const preferedPlatform = useMusicStore((s) => s.preferedPlatform);
  const setPlaybackState = useMusicStore((s) => s.setPlaybackState);
  const setCurrentSong = useMusicStore((s) => s.setCurrentSong);

  const isPlaying = currentSong?.playbackState === "PLAYING";
  const hasSong = currentSong !== null;

  const refreshSpotifyState = useCallback(async () => {
    if (preferedPlatform === "SPOTIFY") {
      try {
        const response = await fetchCurrentSpotifySong();
        if (response && response.data) {
          setCurrentSong(mapBackendSongToSongInfo(response.data));
        }
      } catch (e) {
        console.error("Failed to refresh Spotify state:", e);
      }
    }
  }, [preferedPlatform, setCurrentSong]);

  const play = useCallback(async () => {
    const previousState = currentSong?.playbackState;
    setPlaybackState("PLAYING");
    try {
      await musicPlayback.play();
      // Kleine Verzögerung, damit Spotify Zeit hat zu aktualisieren
      setTimeout(refreshSpotifyState, 500);
    } catch (e) {
      console.error("Play failed:", e);
      if (previousState) setPlaybackState(previousState);
    }
  }, [currentSong?.playbackState, setPlaybackState, refreshSpotifyState]);

  const pause = useCallback(async () => {
    const previousState = currentSong?.playbackState;
    setPlaybackState("PAUSED");
    try {
      await musicPlayback.pause();
      setTimeout(refreshSpotifyState, 500);
    } catch (e) {
      console.error("Pause failed:", e);
      if (previousState) setPlaybackState(previousState);
    }
  }, [currentSong?.playbackState, setPlaybackState, refreshSpotifyState]);

  const togglePlayPause = useCallback(async () => {
    const previousState = currentSong?.playbackState;
    const newState = previousState === "PLAYING" ? "PAUSED" : "PLAYING";
    setPlaybackState(newState);
    try {
      await musicPlayback.togglePlayPause();
      setTimeout(refreshSpotifyState, 500);
    } catch (e) {
      console.error("Toggle play/pause failed:", e);
      if (previousState) setPlaybackState(previousState);
    }
  }, [currentSong?.playbackState, setPlaybackState, refreshSpotifyState]);

  const skipNext = useCallback(async () => {
    try {
      await musicPlayback.skipNext();
      setTimeout(refreshSpotifyState, 500);
    } catch (e) {
      console.error("Skip next failed:", e);
    }
  }, [refreshSpotifyState]);

  const skipPrevious = useCallback(async () => {
    try {
      await musicPlayback.skipPrevious();
      setTimeout(refreshSpotifyState, 500);
    } catch (e) {
      console.error("Skip previous failed:", e);
    }
  }, [refreshSpotifyState]);

  const playTrack = useCallback(async (trackId: string) => {
    try {
      await musicPlayback.playTrack(trackId);
      setTimeout(refreshSpotifyState, 500);
    } catch (e) {
      console.error("Play track failed:", e);
    }
  }, [refreshSpotifyState]);

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
    playTrack,
  };
}
