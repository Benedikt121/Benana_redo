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
  setSpotifyShuffleAPI,
  setSpotifyRepeatAPI,
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
      setTimeout(() => {
        if ((window as any).resolvePlaylists) {
          (window as any).resolvePlaylists = null;
          resolve([]);
        }
      }, 10000);
    });
  },
  playPlaylist: async (playlistId: string, startTrackId?: string) => {
    (window as any).sendMusicCommand?.("PLAY_PLAYLIST", {
      playlistId,
      startTrackId,
    });
  },
  authorize: async () => {
    return new Promise((resolve) => {
      (window as any).resolveAuth = (token: string) => resolve(token);
      (window as any).sendMusicCommand?.("AUTHORIZE");
    });
  },
  setShuffle: async (shuffle: boolean) =>
    (window as any).sendMusicCommand?.("SET_SHUFFLE", { shuffle }),
  setRepeatMode: async (mode: string) =>
    (window as any).sendMusicCommand?.("SET_REPEAT_MODE", { mode }),
  setAutoplay: async (autoplay: boolean) =>
    (window as any).sendMusicCommand?.("SET_AUTOPLAY", { autoplay }),
  fetchPlaylistTracks: async (playlistId: string) => {
    return new Promise((resolve) => {
      (window as any).resolvePlaylistTracks = (tracks: any[]) =>
        resolve(tracks);
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
      playPlaylist: async (
        playlistId: string,
        startTrackId?: string,
        tracks?: any[],
      ) => {
        try {
          await Auth.authorize();

          let startIndex = -1;
          if (startTrackId && tracks) {
            startIndex = tracks.findIndex((t) => t.id === startTrackId);
          }

          // Native Apple Music uses MusicKit.playLibraryPlaylist(id, index)
          await MusicKit.playLibraryPlaylist(playlistId, startIndex);
          await Player.play();
        } catch (e: any) {
          console.error("Native playPlaylist failed:", e);
          toast.error(`Play failed: ${e.message}`);
        }
      },
      authorize: async () => {
        return null;
      },
      setShuffle: async (shuffle: boolean) => {
        const { NativeModules } = require("react-native");
        NativeModules.MusicModule?.setShuffleMode?.(shuffle);
      },
      setRepeatMode: async (mode: string) => {
        const { NativeModules } = require("react-native");
        NativeModules.MusicModule?.setRepeatMode?.(mode);
      },
      setAutoplay: async (autoplay: boolean) => {
        const { NativeModules } = require("react-native");
        NativeModules.MusicModule?.setAutoplay?.(autoplay);
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
    try {
      await setSpotifyShuffleAPI(shuffle);
    } catch (e: any) {
      console.error("Failed to set Spotify shuffle:", e);
      toast.error("Failed to shuffle Spotify");
    }
  },
  setRepeatMode: async (mode: string) => {
    try {
      await setSpotifyRepeatAPI(mode);
    } catch (e: any) {
      console.error("Failed to set Spotify repeat:", e);
      toast.error("Failed to set repeat mode for Spotify");
      throw e;
    }
  },
  setAutoplay: async (autoplay: boolean) => {
    // placeholder for now
  },
  fetchPlaylistTracks: async (playlistId: string) => {
    // placeholder for now
    return [];
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
  init: async () => {
    if (Platform.OS !== "web") return true;

    // For web, we rely on the HeadlessMusicPlayer iframe bridge.
    // We wait until the bridge is ready (sendMusicCommand is available).
    return new Promise((resolve) => {
      if ((window as any).sendMusicCommand) {
        return resolve(true);
      }

      const checkInterval = setInterval(() => {
        if ((window as any).sendMusicCommand) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!(window as any).sendMusicCommand) {
          console.warn("MusicKit bridge initialization timeout");
          resolve(false);
        }
      }, 5000);
    });
  },

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

  playPlaylist: async (
    playlistId: string,
    startTrackId?: string,
    tracks?: any[],
  ) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver?.playPlaylist) {
      await (driver as any).playPlaylist(playlistId, startTrackId, tracks);
    }
  },

  playPlaylistShuffled: async (playlistId: string, tracks?: any[]) => {
    const isAppleMusic =
      useMusicStore.getState().preferedPlatform === "APPLE_MUSIC";

    // Fast-path: If tracks aren't loaded yet, start the playlist immediately
    // and rely on native shuffle.
    if (!tracks || tracks.length === 0) {
      await musicPlayback.playPlaylist(playlistId);
      await musicPlayback.setShuffle(true);
      return;
    }

    // For Apple Music, we pick a random starting track to ensure true randomness from the beginning
    if (isAppleMusic) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      const startTrackId = tracks[randomIndex].id;
      await musicPlayback.playPlaylist(playlistId, startTrackId, tracks);
    } else {
      await musicPlayback.playPlaylist(playlistId);
    }

    // Ensure shuffle is ON - call after playPlaylist to ensure it sticks for the new queue
    await musicPlayback.setShuffle(true);
  },

  authorize: async (platform?: MusicPlatform) => {
    const targetPlatform =
      platform || useMusicStore.getState().preferedPlatform || "APPLE_MUSIC";
    const driver = getDriver(targetPlatform);

    if (driver && (driver as any).authorize) {
      return await (driver as any).authorize();
    }
    return null;
  },

  setShuffle: async (shuffle: boolean) => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).setShuffle) {
      // Optimistic update
      useMusicStore.getState().setShuffle(shuffle);
      try {
        await (driver as any).setShuffle(shuffle);
      } catch (e) {
        // Revert on error
        const previousShuffle = !shuffle;
        useMusicStore.getState().setShuffle(previousShuffle);
      }
    }
  },

  setRepeatMode: async (mode: "off" | "one" | "all") => {
    const driver = getDriver(useMusicStore.getState().preferedPlatform);
    if (driver && (driver as any).setRepeatMode) {
      const previousMode = useMusicStore.getState().repeatMode;
      if (previousMode === mode) return;

      // Optimistic update
      useMusicStore.getState().setRepeatMode(mode);

      let spotifyMode: string = mode;
      if (useMusicStore.getState().preferedPlatform === "SPOTIFY") {
        spotifyMode =
          mode === "all" ? "context" : mode === "one" ? "track" : "off";
      }

      try {
        await (driver as any).setRepeatMode(spotifyMode);
      } catch (e) {
        // Revert on error
        useMusicStore.getState().setRepeatMode(previousMode);
      }
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
