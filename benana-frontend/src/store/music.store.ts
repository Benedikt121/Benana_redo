import { MusicPlatform, SongInfo } from "@/types/MusicTypes";
import { create } from "zustand";

interface MusicState {
  currentSong: SongInfo | null;
  preferedPlatform: MusicPlatform | null;
  listeningToHostId: string | null;

  // Aktionen
  setCurrentSong: (song: SongInfo | null) => void;
  clearSong: () => void;
  setPreferedPlatform: (platform: MusicPlatform) => void;
  setListeningToHostId: (hostId: string | null) => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  currentSong: null,
  preferedPlatform: null,
  listeningToHostId: null,

  setCurrentSong: (song) => set({ currentSong: song }),
  clearSong: () => set({ currentSong: null }),
  setPreferedPlatform: (platform) => set({ preferedPlatform: platform }),
  setListeningToHostId: (hostId) => set({ listeningToHostId: hostId }),
}));
