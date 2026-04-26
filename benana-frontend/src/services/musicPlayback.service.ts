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

declare global {
  interface Window {
    MusicKit: any;
  }
}

const ensureMusicKitLoaded = async () => {
  if (typeof window === "undefined") return false;
  if (window.MusicKit) return true;

  try {
    if (!(window as any).process) (window as any).process = {};
    if (!(window as any).process.versions)
      (window as any).process.versions = {};
    if (!(window as any).Buffer) (window as any).Buffer = Buffer;

    await new Promise<void>((res, rej) => {
      const existingScript = document.querySelector(
        'script[src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"]',
      );
      if (existingScript) {
        if (window.MusicKit) return res();
        document.addEventListener("musickitloaded", () => res());
        return;
      }
      document.addEventListener("musickitloaded", () => res());
      const script = document.createElement("script");
      script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
      script.async = true;
      script.onerror = rej;
      document.head.appendChild(script);
    });

    const devTokenRes = await getAppleDeveloperToken();
    await window.MusicKit.configure({
      developerToken: devTokenRes.token,
      app: { name: "Benana", build: "1.0.0" },
    });

    // Notify the frontend that MusicKit is now fully configured and getInstance() will work
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("musickitconfigured"));
    }

    return true;
  } catch (e) {
    console.error("Failed to load MusicKit:", e);
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
      const instance = window.MusicKit.getInstance();
      try {
        console.log("Playing playlist with ID:", playlistId);

        // 1. Pre-emptively "play" to unlock the audio context on user gesture.
        // This fails if the queue is empty, but satisfies the browser's requirement.
        instance.play().catch(() => {});

        // 2. Fetch the playlist object with tracks
        const isLibrary =
          playlistId.startsWith("p.") || playlistId.startsWith("pl.u-");
        const storefront = instance.storefrontId || "us";
        const url = isLibrary
          ? `v1/me/library/playlists/${playlistId}`
          : `v1/catalog/${storefront}/playlists/${playlistId}`;

        console.log("Fetching playlist data from:", url);
        const response = await instance.api.music(url, { include: "tracks" });
        const playlistObj = response?.data?.data?.[0];

        if (playlistObj) {
          const tracks = playlistObj.relationships?.tracks?.data || [];
          if (tracks.length > 0) {
            console.log(`Found ${tracks.length} tracks, setting queue...`);
            // Setting the queue with MediaItem objects is the most reliable way in V3
            await instance.setQueue({ items: tracks });
          } else {
            console.warn("Playlist has no tracks, falling back to ID...");
            await instance.setQueue({ playlist: playlistId });
          }
        } else {
          console.warn(
            "Could not fetch playlist object, falling back to ID...",
          );
          await instance.setQueue({ playlist: playlistId });
        }

        await instance.play();
        console.log("Playback started successfully!");

        setTimeout(() => {
          console.log(
            "Apple Music status 1s after play:",
            instance.isPlaying,
            instance.nowPlayingItem,
          );
          if (instance.nowPlayingItem) {
            const item = instance.nowPlayingItem;
            useMusicStore.getState().setCurrentSong({
              platform: "APPLE_MUSIC",
              trackId: item.id,
              appleTrackId: item.id,
              title: item.attributes?.name || "Unknown",
              artist: item.attributes?.artistName || "Unknown",
              albumCoverUrl: item.attributes?.artwork?.url
                ? item.attributes.artwork.url
                    .replace("{w}", "600")
                    .replace("{h}", "600")
                : undefined,
              playbackState: instance.isPlaying ? "PLAYING" : "PAUSED",
              timestamp: (instance.currentPlaybackTime || 0) * 1000,
              updatedAt: Date.now(),
            });
          }
        }, 1000);
        setTimeout(() => {
          console.log(
            "Apple Music status 3s after play:",
            instance.isPlaying,
            instance.nowPlayingItem,
          );
        }, 3000);
      } catch (err) {
        console.error("Failed to play Apple Music web playlist:", err);
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
};
