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
import { Buffer } from "buffer";
import { useUserStore } from "@/store/user.store";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import { toast } from "@/utils/toast";

// --- Apple Music (Web) via Headless Iframe Bridge ---
const appleMusicWeb = {
  play: async () => {
    (window as any).sendMusicCommand?.("RESUME");
  },
  pause: async () => {
    (window as any).sendMusicCommand?.("PAUSE");
  },
  skipNext: async () => {
    (window as any).sendMusicCommand?.("SKIP_NEXT");
  },
  skipPrevious: async () => {
    (window as any).sendMusicCommand?.("SKIP_PREV");
  },
  playTrack: async (trackId: string, positionMs: number = 0) => {
    (window as any).sendMusicCommand?.("PLAY_SONG", { songId: trackId });
    if (positionMs > 0) {
      // Small delay to ensure player is ready before seeking
      setTimeout(() => {
        (window as any).sendMusicCommand?.("SEEK", { time: positionMs / 1000 });
      }, 500);
    }
  },
  fetchPlaylists: async () => {
    try {
      const musicUserToken =
        useUserStore.getState().profile?.appleMusicUserToken;

      // If no token in store, we might need to authorize first
      // But we can also check if the iframe thinks it's authorized
      
      return new Promise((resolve) => {
        (window as any).resolvePlaylists = (playlists: any[]) => {
          if (!playlists) return resolve([]);
          resolve(
            playlists.map((p: any) => ({
              id: p.id,
              name: p.attributes.name,
              artworkUrl: p.attributes.artwork?.url
                ?.replace("{w}", "600")
                .replace("{h}", "600"),
            })),
          );
        };
        (window as any).sendMusicCommand?.("FETCH_PLAYLISTS");

        // Timeout after 10 seconds
        setTimeout(() => {
          if ((window as any).resolvePlaylists) {
            (window as any).resolvePlaylists = null;
            resolve([]);
          }
        }, 10000);
      });
    } catch (err) {
      console.error("Apple Music fetch error:", err);
      return [];
    }
  },
  playPlaylist: async (playlistId: string) => {
    (window as any).sendMusicCommand?.("PLAY_PLAYLIST", { playlistId });
  },
  authorize: async () => {
    (window as any).sendMusicCommand?.("AUTHORIZE");
    return new Promise((resolve) => {
      (window as any).resolveAuth = (token: string) => {
        resolve(token);
      };
    });
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

  authorize: async () => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).authorize) {
      return await (driver as any).authorize();
    }
    return null;
  },

  init: async () => {
    // Initialization is now handled by the HeadlessMusicPlayer component
    return true;
  },
};
