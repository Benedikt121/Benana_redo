import {
  APPLE_TOKEN_PATH,
  APPLE_TOKEN_SAVE_PATH,
  SPOTIFY_CURRENT_PATH,
  SPOTIFY_EXCHANGE_PATH,
  SPOTIFY_PLAY_PATH,
  SPOTIFY_REFRESH_PATH,
} from "@/constants/API_CONSTANTS";
import { useAuthStore } from "@/store/auth.store";
import {
  AppleTokenResponse,
  AppleTokenSaveResponse,
  SpotifyCurrentSongResponse,
  SpotifyExchangeResponse,
  SpotifyRefreshResponse,
} from "@/types/MusicTypes";
import axios from "axios";

export const loginUserWithSpotify = async (
  code: string,
  redirectUri: string,
): Promise<SpotifyExchangeResponse> => {
  console.log("Sende Spotify-Code an:", SPOTIFY_EXCHANGE_PATH);
  const { token } = useAuthStore.getState();
  const response = await axios.post<SpotifyExchangeResponse>(
    SPOTIFY_EXCHANGE_PATH,
    { code, redirectUri },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
};

export const getAppleDeveloperToken = async (): Promise<AppleTokenResponse> => {
  const { token } = useAuthStore.getState();
  const response = await axios.get<AppleTokenResponse>(APPLE_TOKEN_PATH, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const saveAppleUserToken = async (
  appleMusicToken: string,
): Promise<AppleTokenSaveResponse> => {
  const { token } = useAuthStore.getState();
  const response = await axios.post<AppleTokenSaveResponse>(
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

export const refreshSpotifyToken =
  async (): Promise<SpotifyRefreshResponse> => {
    const { token } = useAuthStore.getState();
    const response = await axios.get<SpotifyRefreshResponse>(
      SPOTIFY_REFRESH_PATH,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  };

export const fetchCurrentSpotifySong =
  async (): Promise<SpotifyCurrentSongResponse | null> => {
    const { token } = useAuthStore.getState();
    const response = await axios.get<SpotifyCurrentSongResponse>(
      SPOTIFY_CURRENT_PATH,
      {
        headers: { Authorization: `Bearer ${token}` },
        // 204 = no song playing — axios treats this as a valid response
        validateStatus: (status) => status === 200 || status === 204,
      },
    );
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
