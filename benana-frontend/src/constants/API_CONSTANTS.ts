import { Platform } from "react-native";

export let API_URL: string;
if (Platform.OS === "web") {
  API_URL = process.env.EXPO_PUBLIC_API_URL as string;
} else {
  API_URL = process.env.EXPO_PUBLIC_API_URL_MOBILE as string;
}

export const API_PREFIX = `${API_URL}/api/`;

export const AUTH_PATH = `${API_PREFIX}auth/`;
export const LOGIN_PATH = `${AUTH_PATH}login`;
export const REGISTER_PATH = `${AUTH_PATH}register`;
export const LOGOUT_PATH = `${AUTH_PATH}logout`;
