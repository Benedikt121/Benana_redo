import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMusicStore } from "@/store/music.store";
import { socketService } from "@/services/sockets.service";
import type { BackendSongInfo } from "@/types/MusicTypes";

export const useAppleMusicLocalSync = () => {
  const preferedPlatform = useMusicStore((s) => s.preferedPlatform);

  const lastStateRef = useRef<BackendSongInfo | null>(null);

  useEffect(() => {
    if (preferedPlatform !== "APPLE_MUSIC") return;

    const socket = socketService.connect();

    // --- WEB IMPLEMENTATION ---
    if (Platform.OS === "web") {
      const setupWebListeners = () => {
        if (typeof window === "undefined" || !window.MusicKit) return;
        try {
          const instance = window.MusicKit.getInstance ? window.MusicKit.getInstance() : undefined;
          if (!instance) return;

          const handleWebStateChange = async () => {
            if (!socket) return;
            const item = instance.nowPlayingItem;
            if (!item) return;

            const playbackState = instance.isPlaying ? "PLAYING" : "PAUSED";

            let coverUrl = item.attributes?.artwork?.url;
            if (coverUrl && coverUrl.includes("{w}")) {
              coverUrl = coverUrl.replace("{w}", "600").replace("{h}", "600");
            }

            const statusData: BackendSongInfo = {
              platform: "APPLE_MUSIC",
              trackId: item.id,
              appleTrackId: item.id,
              spotifyTrackId: null,
              trackName: item.attributes?.name || "Unknown",
              artist: item.attributes?.artistName || "Unknown",
              coverUrl: coverUrl || "",
              playbackState: playbackState,
              timestamp: instance.currentPlaybackTime * 1000,
              updatedAt: Date.now(),
            };

            const isSame =
              lastStateRef.current?.trackId === statusData.trackId &&
              lastStateRef.current?.playbackState ===
                statusData.playbackState &&
              Math.abs(
                (lastStateRef.current?.timestamp || 0) - statusData.timestamp,
              ) < 2000;

            if (!isSame) {
              lastStateRef.current = statusData;
              
              // Update local UI immediately so background covers work
              useMusicStore.getState().setCurrentSong({
                platform: "APPLE_MUSIC",
                trackId: statusData.trackId,
                appleTrackId: statusData.appleTrackId,
                title: statusData.trackName,
                artist: statusData.artist,
                albumCoverUrl: statusData.coverUrl,
                playbackState: statusData.playbackState,
                timestamp: statusData.timestamp,
                updatedAt: statusData.updatedAt,
              });

              socket.emit("music_status_update", statusData);
            }
          };

          // Try to handle first change, but also setup events
          const events = window.MusicKit.Events;
          if (events) {
            instance.addEventListener(
              events.mediaItemDidChange,
              handleWebStateChange,
            );
            instance.addEventListener(
              events.playbackStateDidChange,
              handleWebStateChange,
            );
            instance.addEventListener(
              events.playbackTimeDidChange,
              handleWebStateChange,
            );

            // Clean up function attached to window for hot reloading
            return () => {
              instance.removeEventListener(
                events.mediaItemDidChange,
                handleWebStateChange,
              );
              instance.removeEventListener(
                events.playbackStateDidChange,
                handleWebStateChange,
              );
              instance.removeEventListener(
                events.playbackTimeDidChange,
                handleWebStateChange,
              );
            };
          }
        } catch (err) {
          console.warn("Error setting up web MusicKit sync:", err);
        }
      };

      if (typeof window !== "undefined") {
        if (window.MusicKit && window.MusicKit.getInstance && window.MusicKit.getInstance()) {
          setupWebListeners();
        }
        window.addEventListener("musickitconfigured", setupWebListeners);
      }
      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("musickitconfigured", setupWebListeners);
        }
      };
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
          if (
            coverUrl &&
            coverUrl.includes("{w}") &&
            coverUrl.includes("{h}")
          ) {
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
              timestamp: state.playbackTime * 1000,
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
