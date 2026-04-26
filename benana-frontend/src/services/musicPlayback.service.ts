import { Platform } from "react-native";
import {
  resumeSpotify,
  pauseSpotify,
  skipNextSpotify,
  skipPreviousSpotify,
  forcePlaySpotify,
} from "@/api/music.api";
import { useMusicStore } from "@/store/music.store";
import type { MusicPlatform } from "@/types/MusicTypes";

// --- Apple Music (Web) via MusicKit JS ---
const appleMusicWeb = {
  play: async () => {
    if (typeof window !== "undefined" && window.MusicKit) {
      await window.MusicKit.getInstance().play();
    }
  },
  pause: async () => {
    if (typeof window !== "undefined" && window.MusicKit) {
      await window.MusicKit.getInstance().pause();
    }
  },
  skipNext: async () => {
    if (typeof window !== "undefined" && window.MusicKit) {
      await window.MusicKit.getInstance().skipToNextItem();
    }
  },
  skipPrevious: async () => {
    if (typeof window !== "undefined" && window.MusicKit) {
      await window.MusicKit.getInstance().skipToPreviousItem();
    }
  },
  playTrack: async (trackId: string, positionMs: number = 0) => {
    if (typeof window !== "undefined" && window.MusicKit) {
      const instance = window.MusicKit.getInstance();
      await instance.setQueue({ song: trackId });
      await instance.play();
      if (positionMs > 0) {
        await instance.seekToTime(positionMs / 1000);
      }
    }
  },
  fetchPlaylists: async () => {
    if (typeof window !== "undefined" && window.MusicKit) {
      const instance = window.MusicKit.getInstance();
      if (!instance.isAuthorized) await instance.authorize();
      const response = await instance.api.library.playlists();
      return response;
    }
    return [];
  },
  playPlaylist: async (playlistId: string) => {
    if (typeof window !== "undefined" && window.MusicKit) {
      const instance = window.MusicKit.getInstance();
      await instance.setQueue({ playlist: playlistId });
      await instance.play();
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
    console.warn("Spotify fetchPlaylists not implemented yet");
    return [];
  },
  playPlaylist: async (playlistId: string) => {
    console.warn("Spotify playPlaylist not implemented yet");
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
