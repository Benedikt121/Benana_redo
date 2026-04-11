import { Backgrounds } from "@/types/UserTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { useMusicStore } from "./music.store";

export interface UserProfile {
  id: string;
  username: string;
  color: string; //Hex
  profilePictureUrl: string | null;
  createdAt: Date;
  currentRoomId: string | null;
  isReady: boolean;
  appleMusicUserToken: string | null;
  spotifyAccessToken: string | null;
  isAppleLinked: boolean;
  isSpotifyLinked: boolean;
  preferredPlatform?: "SPOTIFY" | "APPLE_MUSIC" | null;
  preferedBackground?: Backgrounds;
}

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: async (profile) => {
    if (!profile) {
      set({ profile: null });
      return;
    }

    const preferedBackground =
      ((await AsyncStorage.getItem("background")) as Backgrounds) ??
      "rainyWindow";
    const completeProfile: UserProfile = { ...profile, preferedBackground };
    set({ profile: completeProfile });
  },
}));

// Subscribe to music store preferredPlatform changes
useMusicStore.subscribe((state) => {
  useUserStore.setState((userState) => ({
    profile: userState.profile
      ? {
          ...userState.profile,
          preferredPlatform: state.preferedPlatform,
        }
      : null,
  }));
});
