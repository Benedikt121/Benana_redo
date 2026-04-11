import { Backgrounds, MeResponse } from "@/types/UserTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export interface UserProfile {
  id: string;
  username: string;
  profileColor?: string;
  avatarUrl?: string | null;
  preferredPlatform?: "SPOTIFY" | "APPLE_MUSIC" | "NONE";
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
