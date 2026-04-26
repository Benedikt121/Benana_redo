import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMusicStore } from "@/store/music.store";
import { socketService } from "@/services/sockets.service";
import type { BackendSongInfo } from "@/types/MusicTypes";

export const useAppleMusicLocalSync = () => {
  const preferedPlatform = useMusicStore((s) => s.preferedPlatform);

  const lastStateRef = useRef<BackendSongInfo | null>(null);

  useEffect(() => {
    if (Platform.OS !== "ios" || preferedPlatform !== "APPLE_MUSIC") return;

    const socket = socketService.connect();

    let Player: any;
    try {
      Player = require("@lomray/react-native-apple-music").Player;
    } catch {
      return;
    }

    const syncToBackend = async () => {
      if (!socket) return;
      try {
        const state = await Player.getCurrentState();
        if (!state || !state.currentSong) return;

        const song = state.currentSong;
        const newPlaybackState =
          state.playbackStatus === "playing" ? "PLAYING" : "PAUSED";

        let coverUrl = song.artworkUrl;
        if (coverUrl && coverUrl.includes("{w}") && coverUrl.includes("{h}")) {
          coverUrl = coverUrl.replace("{w}", "600").replace("{h}", "600");
        }

        const statusData: BackendSongInfo = {
          platform: "APPLE_MUSIC",
          trackId: song.id,
          appleTrackId: song.id,
          spotifyTrackId: null,
          trackName: song.title,
          artist: song.artistName,
          coverUrl: coverUrl,
          playbackState: newPlaybackState,
          timestamp: state.playbackTime * 1000,
          updatedAt: Date.now(),
        };

        // Update local UI immediately so background covers work
        useMusicStore.getState().setCurrentSong({
          platform: "APPLE_MUSIC",
          trackId: song.id,
          appleTrackId: song.id,
          title: song.title,
          artist: song.artistName,
          albumCoverUrl: coverUrl,
          playbackState: newPlaybackState,
          timestamp: state.playbackTime * 1000,
          updatedAt: Date.now(),
        });

        const stateHasChanged =
          lastStateRef.current?.trackId !== song.id ||
          lastStateRef.current?.playbackState !== newPlaybackState;

        if (stateHasChanged) {
          console.log(
            "🎵 Apple Music Sync: Emitting update to backend",
            statusData,
          );
          socket.emit("music_status_update", statusData);
          lastStateRef.current = statusData;
        } else {
          console.log(
            "🎵 Apple Music Sync: State didn't change, skipping emit",
          );
        }
      } catch (e) {
        console.error("Failed to sync apple music local state", e);
      }
    };

    console.log("🎵 Apple Music Sync: Hook mounted, listening to events...");
    const subState = Player.addListener("onPlaybackStateChange", syncToBackend);
    const subSong = Player.addListener("onCurrentSongChange", syncToBackend);

    return () => {
      subState?.remove();
      subSong?.remove();
    };
  }, [preferedPlatform]);
};
