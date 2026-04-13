import { useAuthStore } from "@/store/auth.store";
import { Platform } from "react-native";

export let API_URL: string;
if (Platform.OS === "web") {
  API_URL = process.env.EXPO_PUBLIC_API_URL as string;
} else {
  API_URL = process.env.EXPO_PUBLIC_API_URL_MOBILE as string;
}

export const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: `Bearer ${token}` };
};

export const API_PREFIX = `${API_URL}/api/`;

export const AUTH_PATH = `${API_PREFIX}auth/`;
export const LOGIN_PATH = `${AUTH_PATH}login`;
export const REGISTER_PATH = `${AUTH_PATH}register`;
export const LOGOUT_PATH = `${AUTH_PATH}logout`;

export const USER_PATH = `${API_PREFIX}users/`;
export const ME_PATH = `${USER_PATH}me`;

export const FRIEND_PATH = `${API_PREFIX}friends/`;
export const FRIEND_REQUESTS_PATH = `${FRIEND_PATH}requests`;

export const INVITE_PATH = `${API_PREFIX}invites`;

export const MUSIC_PATH = `${API_PREFIX}music/`;
export const SPOTIFY_PATH = `${MUSIC_PATH}spotify/`;
export const APPLE_MUSIC_PATH = `${MUSIC_PATH}apple/`
export const SPOTIFY_EXCHANGE_PATH = `${SPOTIFY_PATH}exchange`;
export const APPLE_TOKEN_PATH = `${MUSIC_PATH}apple-token/`;
export const APPLE_TOKEN_SAVE_PATH = `${APPLE_TOKEN_PATH}save`;
export const APPLE_MOBILE_LOGIN_PATH = `${APPLE_MUSIC_PATH}mobile-login`
