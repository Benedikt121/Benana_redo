import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useMusicStore } from "@/store/music.store";

// This file is only loaded on iOS (web uses .web.ts stub)
let NowPlayingActivity: any = null;

if (Platform.OS === "ios") {
  try {
    NowPlayingActivity =
      require("@/widgets/NowPlayingActivity").default;
  } catch {
    console.warn("NowPlayingActivity widget not available");
  }
}

/**
 * Hook that syncs the current song state to an iOS Live Activity / Dynamic Island.
 *
 * - When a song starts playing → starts a Live Activity
 * - When the song changes → updates the Live Activity
 * - When music stops → ends the Live Activity
 *
 * Only runs on iOS. Web/Android use the .web.ts no-op stub.
 */
export function useMusicLiveActivity() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const instanceRef = useRef<any>(null);
  const lastSongIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only on iOS with the widget available
    if (Platform.OS !== "ios" || !NowPlayingActivity) return;

    const updateActivity = async () => {
      try {
        if (currentSong) {
          const props = {
            title: currentSong.title,
            artist: currentSong.artist,
            albumArtUrl: currentSong.albumCoverUrl ?? "",
            isPlaying: currentSong.playbackState === "PLAYING",
          };

          if (!instanceRef.current) {
            // Start a new Live Activity
            instanceRef.current = NowPlayingActivity.start(
              props,
              "benanafrontend://now-playing"
            );
            lastSongIdRef.current = currentSong.trackId ?? null;
          } else {
            // Update existing Live Activity
            await instanceRef.current.update(props);

            // Track if the song changed
            if (currentSong.trackId !== lastSongIdRef.current) {
              lastSongIdRef.current = currentSong.trackId ?? null;
            }
          }
        } else {
          // No song — end the Live Activity
          if (instanceRef.current) {
            try {
              await instanceRef.current.end("immediate");
            } catch {
              // Already ended or expired
            }
            instanceRef.current = null;
            lastSongIdRef.current = null;
          }
        }
      } catch (error) {
        console.error("Live Activity error:", error);
      }
    };

    updateActivity();
  }, [currentSong]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.end("immediate");
        } catch {
          // Already ended
        }
        instanceRef.current = null;
      }
    };
  }, []);
}
