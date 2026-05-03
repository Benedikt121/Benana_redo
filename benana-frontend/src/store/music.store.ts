import {
  MusicPlatform,
  SongInfo,
  PlaybackState,
  RepeatMode,
} from "@/types/MusicTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface MusicState {
  currentSong: SongInfo | null;
  preferedPlatform: MusicPlatform | null;
  listeningToHostId: string | null;
  expandedPlayerVisible: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  autoplay: boolean;

  // Aktionen
  setCurrentSong: (song: SongInfo | null) => void;
  clearSong: () => void;
  setPreferedPlatform: (platform: MusicPlatform) => Promise<void>;
  setListeningToHostId: (hostId: string | null) => void;
  setExpandedPlayerVisible: (visible: boolean) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setAutoplay: (autoplay: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  preferedPlatform: null,
  listeningToHostId: null,
  expandedPlayerVisible: false,
  shuffle: false,
  repeatMode: "off",
  autoplay: true,

  setCurrentSong: (song) => set({ currentSong: song }),
  clearSong: () => set({ currentSong: null }),
  setPreferedPlatform: async (platform) => {
    await AsyncStorage.setItem("preferedPlatform", platform);
    set({ preferedPlatform: platform });
  },
  setListeningToHostId: (hostId) => set({ listeningToHostId: hostId }),
  setExpandedPlayerVisible: (visible) =>
    set({ expandedPlayerVisible: visible }),
  setPlaybackState: (state) =>
    set((s) => ({
      currentSong: s.currentSong
        ? { ...s.currentSong, playbackState: state }
        : null,
    })),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),
  setAutoplay: (autoplay) => set({ autoplay }),
  hydrate: async () => {
    try {
      const platform = await AsyncStorage.getItem("preferedPlatform");
      if (platform) {
        set({ preferedPlatform: platform as MusicPlatform });
      }
    } catch (error) {
      console.error("Failed to hydrate music store:", error);
    }
  },
}));
