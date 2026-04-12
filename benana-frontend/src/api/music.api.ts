import {
  APPLE_TOKEN_PATH,
  APPLE_TOKEN_SAVE_PATH,
  SPOTIFY_EXCHANGE_PATH,
} from "@/constants/API_CONSTANTS";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

export const loginUserWithSpotify = async (
  code: string,
  redirectUri: string,
) => {
  console.log("Sende Spotify-Code an:", SPOTIFY_EXCHANGE_PATH);
  const { token } = useAuthStore.getState();
  const response = await axios.post(
    SPOTIFY_EXCHANGE_PATH,
    { code, redirectUri },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response;
};

export const getAppleDeveloperToken = async () => {
  const { token } = useAuthStore.getState();
  const response = await axios.get(APPLE_TOKEN_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

export const saveAppleUserToken = async (appleMusicToken: string) => {
  const { token } = useAuthStore.getState();
  const response = await axios.post(
    APPLE_TOKEN_SAVE_PATH,
    { appleMusicToken },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response;
};
