import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMusicStore } from "@/store/music.store";
import { socketService } from "@/services/sockets.service";
import type { BackendSongInfo } from "@/types/MusicTypes";

export const useAppleMusicLocalSync = () => {
  const preferedPlatform = useMusicStore((s) => s.preferedPlatform);
  const setCurrentSong = useMusicStore((s) => s.setCurrentSong);

  const lastStateRef = useRef<BackendSongInfo | null>(null);

  useEffect(() => {
    if (preferedPlatform !== "APPLE_MUSIC") return;

    const socket = socketService.connect();

    // --- WEB IMPLEMENTATION ---
    if (Platform.OS === "web") {
      // Apple Music Web Sync is now handled by HeadlessMusicPlayer.web.tsx
      // to support the iframe bridge architecture.
      return;
    }

    // --- NATIVE IOS IMPLEMENTATION ---
    if (Platform.OS !== "ios") return;

    let Player: any;
    try {
      Player = require("@lomray/react-native-apple-music").Player;
    } catch {
      return;
    }

    let syncTimeout: NodeJS.Timeout | null = null;

    const syncToBackend = async () => {
      // Basic debounce to prevent spamming the bridge 20x a second
      if (syncTimeout) clearTimeout(syncTimeout);

      syncTimeout = setTimeout(async () => {
        // console.log("🎵 Apple Music Sync: syncToBackend triggered! Socket exists:", !!socket);
        if (!socket) return;
        try {
          const state = await Player.getCurrentState();
          if (!state || !state.currentSong) return;

          const song = state.currentSong;
          const newPlaybackState =
            state.playbackStatus === "playing" ? "PLAYING" : "PAUSED";

          let coverUrl = song.artworkUrl;
          if (coverUrl) {
            if (coverUrl.includes("{w}") && coverUrl.includes("{h}")) {
              coverUrl = coverUrl.replace("{w}", "600").replace("{h}", "600");
            } else {
              // Replace pre-formatted resolutions like 200x200 with 600x600
              coverUrl = coverUrl.replace(/\d+x\d+/, "600x600");
            }
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
            timestamp: Number(state.playbackTime) * 1000,
            length: Number(song.duration) * 1000,
            updatedAt: Date.now(),
          };

          const stateHasChanged =
            lastStateRef.current?.trackId !== song.id ||
            lastStateRef.current?.playbackState !== newPlaybackState;

          if (stateHasChanged) {
            console.log(
              "🎵 Apple Music Sync: State changed, updating UI and backend",
              statusData,
            );

            // Update local UI immediately so background covers work
            useMusicStore.getState().setCurrentSong({
              platform: "APPLE_MUSIC",
              trackId: song.id,
              appleTrackId: song.id,
              title: song.title,
              artist: song.artistName,
              albumCoverUrl: coverUrl,
              playbackState: newPlaybackState,
              timestamp: Number(state.playbackTime) * 1000,
              length: Number(song.duration) * 1000,
              updatedAt: Date.now(),
            });

            socket.emit("music_status_update", statusData);
            lastStateRef.current = statusData;
          }
        } catch (e) {
          console.error("Failed to sync apple music local state", e);
        }
      }, 500); // 500ms debounce
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
