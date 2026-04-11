import { MusicPlatform, SongInfo } from "@/types/MusicTypes";
import { create } from "zustand";
import { useUserStore } from "./user.store";

interface MusicState {
  currentSong: SongInfo | null;
  preferedPlatform: MusicPlatform | null;
  listeningToHostId: string | null;

  spotifyAccessToken: string | null;
  appleMusicUserToken: string | null;
  isSpotifyLinked: boolean;
  isAppleLinked: boolean;

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

  spotifyAccessToken: null,
  appleMusicUserToken: null,
  isSpotifyLinked: false,
  isAppleLinked: false,

  setCurrentSong: (song) => set({ currentSong: song }),
  clearSong: () => set({ currentSong: null }),
  setPreferedPlatform: (platform) => set({ preferedPlatform: platform }),
  setListeningToHostId: (hostId) => set({ listeningToHostId: hostId }),
}));

// Subscribe to user store changes
useUserStore.subscribe((state) => {
  if (state.profile) {
    useMusicStore.setState({
      spotifyAccessToken: state.profile.spotifyAccessToken,
      appleMusicUserToken: state.profile.appleMusicUserToken,
      isSpotifyLinked: state.profile.isSpotifyLinked,
      isAppleLinked: state.profile.isAppleLinked,
    });
  } else {
    useMusicStore.setState({
      spotifyAccessToken: null,
      appleMusicUserToken: null,
      isSpotifyLinked: false,
      isAppleLinked: false,
    });
  }
});
