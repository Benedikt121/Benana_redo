import { MusicPlatform, SongInfo } from "@/types/MusicTypes";
import { create } from "zustand";

interface MusicState {
  currentSong: SongInfo | null;
  preferedPlatform: MusicPlatform | null;

  // Aktionen
  setCurrentSong: (song: SongInfo | null) => void;
  clearSong: () => void;
  setPreferedPlatform: (platform: MusicPlatform) => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  preferedPlatform: null,

  setCurrentSong: (song) => set({ currentSong: song }),
  clearSong: () => set({ currentSong: null }),
  setPreferedPlatform: (platform) => set({ preferedPlatform: platform }),
}));
