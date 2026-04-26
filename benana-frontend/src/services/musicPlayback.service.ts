import { Platform } from "react-native";
import {
  resumeSpotify,
  pauseSpotify,
  skipNextSpotify,
  skipPreviousSpotify,
  forcePlaySpotify,
  fetchSpotifyPlaylists,
  playSpotifyPlaylistAPI,
  getAppleDeveloperToken,
} from "@/api/music.api";
import { useMusicStore } from "@/store/music.store";
import type { MusicPlatform } from "@/types/MusicTypes";
import { toast } from "@/utils/toast";
import { Buffer } from "buffer";
import { useUserStore } from "@/store/user.store";
import { useAuthStore } from "@/store/auth.store";

declare global {
  interface Window {
    MusicKit: any;
  }
}
let isMusicKitConfiguring = false;
let isMusicKitConfigured = false;

const ensureMusicKitLoaded = async () => {
  if (typeof window === "undefined") return false;
  if (isMusicKitConfigured) return true;

  const { token } = useAuthStore.getState();
  if (!token) {
    console.log("[DEBUG-MUSIC] No auth token yet, delaying MusicKit init");
    return false;
  }

  if (isMusicKitConfiguring) {
    // Wait for existing configuration to finish
    return new Promise((res) => {
      window.addEventListener("musickitconfigured", () => res(true), {
        once: true,
      });
    });
  }

  isMusicKitConfiguring = true;

  try {
    await new Promise<void>((res, rej) => {
      const scriptUrl =
        "https://js-cdn.music.apple.com/musickit/v3/musickit.js";

      // If valid, resolve immediately
      if (window.MusicKit && typeof window.MusicKit.configure === "function") {
        return res();
      }

      console.log(
        "[DEBUG-MUSIC] MusicKit missing or invalid, setting up listeners...",
      );

      document.addEventListener(
        "musickitloaded",
        () => {
          console.log("[DEBUG-MUSIC] musickitloaded event received!");
          res();
        },
        { once: true },
      );

      const existingScript = document.querySelector(
        `script[src="${scriptUrl}"]`,
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.onerror = (e) => {
        console.error("[DEBUG-MUSIC] MusicKit script failed to load", e);
        rej(e);
      };
      document.head.appendChild(script);
    });

    const devTokenRes = await getAppleDeveloperToken();
    const token = devTokenRes.token;
    console.log("[DEBUG-MUSIC] Dev Token received, length:", token?.length);
    if (!token) throw new Error("No developer token received from backend");

    await window.MusicKit.configure({
      developerToken: token,
      app: { name: "Benana", build: "1.0.0" },
      storefrontId: "de",
    });

    isMusicKitConfigured = true;
    isMusicKitConfiguring = false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("musickitconfigured"));
    }
    return true;
  } catch (e) {
    console.error("Failed to load MusicKit:", e);
    isMusicKitConfiguring = false; // Fix: reset flag so next attempt can retry
    return false;
  }
};

// --- Apple Music (Web) via MusicKit JS ---
const appleMusicWeb = {
  play: async () => {
    if (await ensureMusicKitLoaded()) {
      await window.MusicKit.getInstance().play();
    }
  },
  pause: async () => {
    if (await ensureMusicKitLoaded()) {
      await window.MusicKit.getInstance().pause();
    }
  },
  skipNext: async () => {
    if (await ensureMusicKitLoaded()) {
      await window.MusicKit.getInstance().skipToNextItem();
    }
  },
  skipPrevious: async () => {
    if (await ensureMusicKitLoaded()) {
      await window.MusicKit.getInstance().skipToPreviousItem();
    }
  },
  playTrack: async (trackId: string, positionMs: number = 0) => {
    if (await ensureMusicKitLoaded()) {
      const instance = window.MusicKit.getInstance();
      await instance.setQueue({ song: trackId });
      await instance.play();
      if (positionMs > 0) {
        await instance.seekToTime(positionMs / 1000);
      }
    }
  },
  fetchPlaylists: async () => {
    if (await ensureMusicKitLoaded()) {
      const instance = window.MusicKit.getInstance();
      if (!instance.isAuthorized) await instance.authorize();

      try {
        const response = await instance.api.music("v1/me/library/playlists");
        console.log("Apple Music Playlists Response:", response);

        if (response && response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response && Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (err) {
        console.error("MusicKit fetch error:", err);
        return [];
      }
    }
    return [];
  },
  playPlaylist: async (playlistId: string) => {
    if (await ensureMusicKitLoaded()) {
      const music = window.MusicKit.getInstance();
      console.log("[DEBUG-MUSIC] playPlaylist called for ID:", playlistId);
      console.log("[DEBUG-MUSIC] Current Instance:", music);
      console.log("[DEBUG-MUSIC] isAuthorized:", music.isAuthorized);

      try {
        if (!music.isAuthorized) {
          console.log("[DEBUG-MUSIC] Not authorized, calling authorize()...");
          await music.authorize();
        }

        console.log(
          "[DEBUG-MUSIC] Attempting setQueue with songs: ['1672243820']",
        );
        await music.setQueue({ songs: ["1672243820"], startPlaying: true });

        console.log("[DEBUG-MUSIC] setQueue success, calling play()");
        await music.play();
        console.log(
          "[DEBUG-MUSIC] play() called, playbackState:",
          music.playbackState,
        );
      } catch (err) {
        console.error("[DEBUG-MUSIC] Playback failed in service:", err);
      }
    }
  },
};

// --- Apple Music (iOS) via @lomray/react-native-apple-music ---
let appleMusicNative: typeof appleMusicWeb | null = null;

if (Platform.OS === "ios") {
  try {
    // Dynamic import to avoid crashing on web/android
    const { Player, MusicKit } = require("@lomray/react-native-apple-music");
    appleMusicNative = {
      play: () => Player.play(),
      pause: () => Player.pause(),
      skipNext: () => Player.skipToNextEntry(),
      skipPrevious: () => Player.skipToPreviousEntry(),
      playTrack: async (trackId: string, positionMs: number = 0) => {
        await MusicKit.setPlaybackQueue(trackId, "song");
        await Player.play();
        if (positionMs > 0) {
          Player.seekToTime(positionMs / 1000);
        }
      },
      fetchPlaylists: async () => {
        try {
          const res = await MusicKit.getUserPlaylists();
          return res.playlists || [];
        } catch (e) {
          console.error("Native fetchPlaylists failed:", e);
          return [];
        }
      },
      playPlaylist: async (playlistId: string) => {
        await MusicKit.playLibraryPlaylist(playlistId);
        await Player.play();
      },
    };
  } catch {
    console.warn("@lomray/react-native-apple-music not available");
  }
}

// --- Spotify via Backend API ---
const spotifyBackend = {
  play: async () => {
    await resumeSpotify();
  },
  pause: async () => {
    await pauseSpotify();
  },
  skipNext: async () => {
    await skipNextSpotify();
  },
  skipPrevious: async () => {
    await skipPreviousSpotify();
  },
  playTrack: async (trackId: string, positionMs: number) => {
    await forcePlaySpotify(trackId, positionMs);
  },
  fetchPlaylists: async () => {
    try {
      const response = await fetchSpotifyPlaylists();
      console.log("Spotify Playlists Response:", response);
      if (response && response.items) {
        // Map Spotify format to the structure expected by the UI
        return response.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          artworkUrl: item.images?.[0]?.url,
        }));
      }
      return [];
    } catch (e: any) {
      console.error("Failed to fetch Spotify playlists:", e);
      const msg =
        e.response?.data?.message ||
        e.message ||
        "Failed to fetch Spotify playlists";
      toast.error(msg);
      return [];
    }
  },
  playPlaylist: async (playlistId: string) => {
    try {
      await playSpotifyPlaylistAPI(playlistId);
    } catch (e: any) {
      console.error("Failed to play Spotify playlist:", e);
      const msg =
        e.response?.data?.message ||
        e.message ||
        "Failed to play Spotify playlist";
      toast.error(msg);
    }
  },
};

// --- Platform Router ---

function getDriver(platform: MusicPlatform | null) {
  if (!platform) return null;

  if (platform === "APPLE_MUSIC") {
    if (Platform.OS === "web") return appleMusicWeb;
    if (Platform.OS === "ios" && appleMusicNative) return appleMusicNative;
    return null;
  }

  if (platform === "SPOTIFY") {
    return spotifyBackend;
  }

  return null;
}

export const musicPlayback = {
  play: async () => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver) await driver.play();
  },

  pause: async () => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver) await driver.pause();
  },

  togglePlayPause: async () => {
    const currentSong = useMusicStore.getState().currentSong;
    if (!currentSong) return;

    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (!driver) return;

    if (currentSong.playbackState === "PLAYING") {
      await driver.pause();
    } else {
      await driver.play();
    }
  },

  skipNext: async () => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver) await driver.skipNext();
  },

  skipPrevious: async () => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver) await driver.skipPrevious();
  },

  playTrack: async (trackId: string, positionMs: number = 0) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && driver.playTrack) await driver.playTrack(trackId, positionMs);
  },

  fetchPlaylists: async () => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && driver.fetchPlaylists) {
      return await driver.fetchPlaylists();
    }
    return [];
  },

  playPlaylist: async (playlistId: string) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && driver.playPlaylist) {
      await driver.playPlaylist(playlistId);
    }
  },

  // Explicitly expose initialization for components that need it early
  init: async () => {
    return await ensureMusicKitLoaded();
  },
};

if (typeof window !== "undefined") {
  (window as any).musicPlayback = musicPlayback;

  // Always expose debug function, but make it call init internally
  (window as any).testAppleMusic = async () => {
    console.log("[DEBUG-CONSOLE] Starting console test...");
    console.log("[DEBUG-CONSOLE] Is Secure Context:", window.isSecureContext);
    if (!window.isSecureContext) {
      console.warn(
        "[DEBUG-CONSOLE] WARNING: Not a secure context! Playback WILL fail on non-localhost IP addresses.",
      );
    }

    const success = await musicPlayback.init();
    if (!success) {
      console.error("[DEBUG-CONSOLE] MusicKit initialization failed.");
      return;
    }
    const music = window.MusicKit.getInstance();

    console.log("[DEBUG-CONSOLE] Waiting 2 seconds for lazy-loading...");
    await new Promise((r) => setTimeout(r, 2000));

    console.log("[DEBUG-CONSOLE] Instance details:", {
      version: (window as any).MusicKit.version,
      isAuthorized: music.isAuthorized,
      storefrontId: music.storefrontId,
      hasPlayer: !!music.player,
      bitrate: music.bitrate
    });

    const SIMPLE_ID = "1440935467"; // Taylor Swift
    console.log(
      `[DEBUG-CONSOLE] Trying simplest possible play: ${SIMPLE_ID}...`,
    );
    try {
      await music.setQueue({ songs: [SIMPLE_ID] });
      console.log(
        "[DEBUG-CONSOLE] setQueue finished. nowPlayingItem:",
        music.nowPlayingItem?.id,
      );

      if (music.nowPlayingItem) {
        await music.play();
        console.log(
          "[DEBUG-CONSOLE] play() called, state:",
          music.playbackState,
        );
      } else {
        console.error(
          "[DEBUG-CONSOLE] Even simplest play failed. Testing Token in test_musickit.html is now MANDATORY.",
        );
      }
      // Diagnostic: Try a search to see if the token works at all
      console.log(
        "[DEBUG-CONSOLE] Testing API access: Fetching song metadata via v3 API...",
      );
      let fetchedSong = null;
      try {
        const response = await music.api.music(
          "v1/catalog/de/songs/1672243820",
        );
        fetchedSong = response.data.data[0];
        console.log(
          "[DEBUG-CONSOLE] API Fetch Success:",
          fetchedSong.attributes.name,
        );
      } catch (apiErr) {
        console.error(
          "[DEBUG-CONSOLE] API Fetch FAILED! Token or Origin is likely blocked:",
          apiErr,
        );
      }

      if (fetchedSong) {
        console.log(
          "[DEBUG-CONSOLE] Trying 'Full Object' format: { items: [songObject] }",
        );
        await music.setQueue({ items: [fetchedSong], startPlaying: true });
        console.log(
          "[DEBUG-CONSOLE] Full Object result - nowPlayingItem:",
          music.nowPlayingItem?.id,
        );
      }

      if (!music.nowPlayingItem) {
        // Try format 1: songs array
        console.log(
          "[DEBUG-CONSOLE] Trying fallback format: { songs: ['1672243820'] }",
        );
        await music.setQueue({ songs: ["1672243820"], startPlaying: true });
        console.log(
          "[DEBUG-CONSOLE] Fallback result - nowPlayingItem:",
          music.nowPlayingItem?.id,
        );
      }

      if (!music.nowPlayingItem) {
        // Try format 2: song singular
        console.log(
          "[DEBUG-CONSOLE] Format 1 failed, trying format: { song: '1672243820' }",
        );
        await music.setQueue({ song: "1672243820", startPlaying: true });
        console.log(
          "[DEBUG-CONSOLE] Format 2 result - nowPlayingItem:",
          music.nowPlayingItem?.id,
        );
      }

      if (music.nowPlayingItem) {
        await music.play();
        console.log(
          "[DEBUG-CONSOLE] play() called, state:",
          music.playbackState,
        );
      } else {
        console.error(
          "[DEBUG-CONSOLE] All setQueue formats failed to populate nowPlayingItem. This strongly suggests a Token or Storefront issue.",
        );
      }

      // Monitor for 5 seconds
      let count = 0;
      const int = setInterval(() => {
        console.log(
          `[DEBUG-CONSOLE] Polling state (${count}):`,
          music.playbackState,
          "Playing:",
          music.isPlaying,
        );
        if (++count > 5) clearInterval(int);
      }, 1000);
    } catch (e) {
      console.error("[DEBUG-CONSOLE] setQueue/play failed:", e);
    }
  };
}
