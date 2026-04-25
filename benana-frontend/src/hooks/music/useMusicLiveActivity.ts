import { useEffect, useRef } from "react";
import { Platform, Alert, Linking } from "react-native";
import { useMusicStore } from "@/store/music.store";
import { addUserInteractionListener } from "expo-widgets";
import { musicPlayback } from "@/services/musicPlayback.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

// This file is only loaded on iOS (web uses .web.ts stub)
let NowPlayingActivity: any = null;

if (Platform.OS === "ios") {
  try {
    NowPlayingActivity = require("@/widgets/NowPlayingActivity").default;
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
const HAS_ASKED_LIVE_ACTIVITIES = "benana_has_asked_live_activities";

export function useMusicLiveActivity() {
  const currentSong = useMusicStore((s) => s.currentSong);
  const instanceRef = useRef<any>(null);
  const lastSongIdRef = useRef<string | null>(null);

  // Check for availability and guide user on first use
  useEffect(() => {
    if (Platform.OS !== "ios" || !NowPlayingActivity) return;

    const checkAvailability = async () => {
      const hasAsked = await AsyncStorage.getItem(HAS_ASKED_LIVE_ACTIVITIES);

      if (!NowPlayingActivity.isAvailable() && !hasAsked) {
        Alert.alert(
          "Dynamic Island Support",
          "Benana can show what's playing directly on your Dynamic Island and Lock Screen. Would you like to enable Live Activities in Settings?",
          [
            {
              text: "Not Now",
              style: "cancel",
              onPress: () =>
                AsyncStorage.setItem(HAS_ASKED_LIVE_ACTIVITIES, "true"),
            },
            {
              text: "Open Settings",
              onPress: () => {
                AsyncStorage.setItem(HAS_ASKED_LIVE_ACTIVITIES, "true");
                Linking.openSettings();
              },
            },
          ],
        );
      }
    };

    checkAvailability();
  }, []);

  useEffect(() => {
    // Only on iOS with the widget available
    if (Platform.OS !== "ios" || !NowPlayingActivity) return;

    // Check if Live Activities are supported/enabled on this device
    if (!NowPlayingActivity.isAvailable()) {
      console.warn(
        "[LiveActivity] Not available on this device or disabled in settings.",
      );
      return;
    }

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
            console.log("[LiveActivity] Starting activity...");
            instanceRef.current = NowPlayingActivity.start(
              props,
              "benanafrontend://now-playing",
            );
            lastSongIdRef.current = currentSong.trackId ?? null;
          } else {
            console.log("[LiveActivity] Updating activity...");
            await instanceRef.current.update(props);

            // Track if the song changed
            if (currentSong.trackId !== lastSongIdRef.current) {
              lastSongIdRef.current = currentSong.trackId ?? null;
            }
          }
        } else {
          // No song — end the Live Activity
          if (instanceRef.current) {
            console.log("[LiveActivity] Ending activity (no song)...");
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
        console.error("[LiveActivity] Error:", error);
      }
    };

    updateActivity();
  }, [currentSong]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        console.log("[LiveActivity] Cleaning up (unmount)...");
        try {
          instanceRef.current.end("immediate");
        } catch {
          // Already ended
        }
        instanceRef.current = null;
      }
    };
  }, []);

  // Listen for user interactions from the Live Activity buttons
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const subscription = addUserInteractionListener(async (event) => {
      console.log("[LiveActivity] Interaction event:", event.target);
      if (event.target === "togglePlayback") {
        await musicPlayback.togglePlayPause();
      } else if (event.target === "next") {
        await musicPlayback.skipNext();
      } else if (event.target === "prev") {
        await musicPlayback.skipPrevious();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
