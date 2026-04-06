import { SongInfo } from "@/types/MusicTypes";
import { create } from "zustand";

interface MusicState {
  currentSong: SongInfo | null;

  // Aktionen
  setCurrentSong: (song: SongInfo | null) => void;
  clearSong: () => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,

  setCurrentSong: (song) => set({ currentSong: song }),
  clearSong: () => set({ currentSong: null }),
}));
