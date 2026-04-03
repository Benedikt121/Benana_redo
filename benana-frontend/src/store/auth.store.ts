import { create } from "zustand/react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "@/types/AuthTypes";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;

  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isHydrated: false,

  login: async (token, user) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ token: null, user: null });
  },
  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const user = await AsyncStorage.getItem("user");

      if (token && user) {
        set({ token, user: JSON.parse(user), isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error("Failed to hydrate auth state:", error);
      set({ isHydrated: true });
    }
  },
}));
