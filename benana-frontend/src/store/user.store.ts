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
  setSpotifyAccessToken: (spotifyAccessToken: string) => void;
  setAppleMusicToken: (appleMusicUserToken: string) => void;
  setPreferedBackgound: (background: Backgrounds) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  setProfile: async (profile) => {
    if (!profile) {
      set({ profile: null });
      return;
    }

    try {
      const preferedBackground =
        ((await AsyncStorage.getItem("background")) as Backgrounds) ??
        "rainyWindow";
      const completeProfile: UserProfile = { ...profile, preferedBackground };
      set({ profile: completeProfile });
    } catch (error) {
      console.error("Failed to load prefered background:", error);
      // Fallback to default if storage fails
      set({ profile: { ...profile, preferedBackground: "rainyWindow" } });
    }
  },

  setSpotifyAccessToken: (spotifyAccessToken) => {
    const profile = get().profile;
    if (profile) {
      set({
        profile: { ...profile, spotifyAccessToken, isSpotifyLinked: true },
      });
    }
  },

  setAppleMusicToken: (appleMusicUserToken) => {
    const profile = get().profile;
    if (profile) {
      set({
        profile: { ...profile, appleMusicUserToken, isAppleLinked: true },
      });
    }
  },

  setPreferedBackgound: async (background) => {
    const profile = get().profile;
    if (profile) {
      set({ profile: { ...profile, preferedBackground: background } });
    }
    await AsyncStorage.setItem("background", background as string);
  },
}));

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
