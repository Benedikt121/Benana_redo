import { MusicPlatform, SongInfo } from "@/types/MusicTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface MusicState {
  currentSong: SongInfo | null;
  preferedPlatform: MusicPlatform | null;
  listeningToHostId: string | null;

  // Aktionen
  setCurrentSong: (song: SongInfo | null) => void;
  clearSong: () => void;
  setPreferedPlatform: (platform: MusicPlatform) => Promise<void>;
  setListeningToHostId: (hostId: string | null) => void;
  hydrate: () => Promise<void>;
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  preferedPlatform: null,
  listeningToHostId: null,

  setCurrentSong: (song) => set({ currentSong: song }),
  clearSong: () => set({ currentSong: null }),
  setPreferedPlatform: async (platform) => {
    await AsyncStorage.setItem("preferedPlatform", platform);
    set({ preferedPlatform: platform });
  },
  setListeningToHostId: (hostId) => set({ listeningToHostId: hostId }),
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

