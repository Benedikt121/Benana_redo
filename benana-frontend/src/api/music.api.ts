import {
  APPLE_TOKEN_PATH,
  APPLE_TOKEN_SAVE_PATH,
  SPOTIFY_CURRENT_PATH,
  SPOTIFY_EXCHANGE_PATH,
  SPOTIFY_PLAY_PATH,
  SPOTIFY_REFRESH_PATH,
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
  return response.data;
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
  return response.data;
};

export const refreshSpotifyToken = async () => {
  const { token } = useAuthStore.getState();
  const response = await axios.get(SPOTIFY_REFRESH_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const fetchCurrentSpotifySong = async () => {
  const { token } = useAuthStore.getState();
  const response = await axios.get(SPOTIFY_CURRENT_PATH, {
    headers: { Authorization: `Bearer ${token}` },
    // 204 = no song playing — axios treats this as a valid response
    validateStatus: (status) => status === 200 || status === 204,
  });
  // Backend returns 204 with no body when nothing is playing
  return response.status === 204 ? null : response.data;
};

export const forcePlaySpotify = async (trackId: string, positionMs: number) => {
  const { token } = useAuthStore.getState();
  const response = await axios.post(
    SPOTIFY_PLAY_PATH,
    { spotifyTrackId: trackId, positionMs: positionMs },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response;
};
