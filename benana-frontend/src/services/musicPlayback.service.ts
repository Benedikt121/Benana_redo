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

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

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
  setShuffle: async (shuffle: boolean) => {
    (window as any).sendMusicCommand?.("SET_SHUFFLE", { shuffle });
  },
  setRepeatMode: async (mode: string) => {
    (window as any).sendMusicCommand?.("SET_REPEAT_MODE", { mode });
  },
  setAutoplay: async (autoplay: boolean) => {
    (window as any).sendMusicCommand?.("SET_AUTOPLAY", { autoplay });
  },
  fetchPlaylistTracks: async (playlistId: string) => {
    return new Promise((resolve) => {
      (window as any).resolvePlaylistTracks = (tracks: any[]) => {
        resolve(tracks);
      };
      (window as any).sendMusicCommand?.("FETCH_PLAYLIST_TRACKS", {
        playlistId,
      });
      setTimeout(() => resolve([]), 10000);
    });
  },
};

// --- Apple Music (iOS) via @lomray/react-native-apple-music ---
let appleMusicNative: typeof appleMusicWeb | null = null;

if (Platform.OS === "ios") {
  try {
    // Dynamic import to avoid crashing on web/android
    const {
      Player,
      MusicKit,
      Auth,
      AuthStatus,
    } = require("@lomray/react-native-apple-music");
    appleMusicNative = {
      play: () => Player.play(),
      pause: () => Player.pause(),
      skipNext: () => Player.skipToNextEntry(),
      skipPrevious: () => Player.skipToPreviousEntry(),
      playTrack: async (trackId: string, positionMs: number = 0) => {
        try {
          await MusicKit.setPlaybackQueue(trackId, "song");
          await Player.play();
          if (positionMs > 0) {
            Player.seekToTime(positionMs / 1000);
          }
        } catch (e: any) {
          try {
            await MusicKit.setPlaybackQueue(trackId, "song");
            await Player.play();
          } catch (e2) {
            console.error("Native playTrack fallback failed:", e2);
          }
        }
      },
      fetchPlaylists: async () => {
        try {
          const status = await Auth.authorize();
          if (status !== AuthStatus.AUTHORIZED) {
            console.warn("Apple Music auth status:", status);
            return [];
          }
          const res = await MusicKit.getUserPlaylists();
          return res.playlists || [];
        } catch (e) {
          console.error("Native fetchPlaylists failed:", e);
          return [];
        }
      },
      playPlaylist: async (playlistId: string) => {
        try {
          await Auth.authorize();
          await MusicKit.playLibraryPlaylist(playlistId);
          await Player.play();
        } catch (e: any) {
          console.error("Native playPlaylist failed:", e);
          toast.error(`Play failed: ${e.message}`);
        }
      },
      authorize: async () => {
        // Native iOS authorization is handled by the system or internally
        return null;
      },
      setShuffle: async (shuffle: boolean) => {
        // Not supported on native
      },
      setRepeatMode: async (mode: string) => {
        // Not supported on native
      },
      setAutoplay: async (autoplay: boolean) => {
        // Not supported on native
      },
      fetchPlaylistTracks: async (playlistId: string) => {
        const res = await MusicKit.getPlaylistSongs(playlistId);
        const songs = res?.songs || [];
        return songs.map((s: any) => ({
          id: s.id,
          name: s.title || s.name || "Unknown Track",
          artist: s.artistName || s.artist || "Unknown Artist",
          artworkUrl: s.artworkUrl && s.artworkUrl !== "" ? s.artworkUrl : null,
          durationMs: parseFloat(s.duration || "0") * 1000,
        }));
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
      if (response && response.items) {
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
  authorize: async () => {
    // Spotify auth is handled via our custom backend flow
    return null;
  },
  setShuffle: async (shuffle: boolean) => {
    // placeholder for now
  },
  setRepeatMode: async (mode: string) => {
    // placeholder for now
  },
  setAutoplay: async (autoplay: boolean) => {
    // placeholder for now
  },
  fetchPlaylistTracks: async (playlistId: string) => {
    // placeholder for now
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

  setShuffle: async (shuffle: boolean) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).setShuffle) {
      await (driver as any).setShuffle(shuffle);
      useMusicStore.getState().setShuffle(shuffle);
    }
  },

  setRepeatMode: async (mode: "off" | "one" | "all") => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).setRepeatMode) {
      await (driver as any).setRepeatMode(mode);
      useMusicStore.getState().setRepeatMode(mode);
    }
  },

  setAutoplay: async (autoplay: boolean) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).setAutoplay) {
      await (driver as any).setAutoplay(autoplay);
      useMusicStore.getState().setAutoplay(autoplay);
    }
  },

  fetchPlaylistTracks: async (playlistId: string) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).fetchPlaylistTracks) {
      return await (driver as any).fetchPlaylistTracks(playlistId);
    }
    return [];
  },
};
