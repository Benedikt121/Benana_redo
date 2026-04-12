import {
  getAuthHeaders,
  SPOTIFY_EXCHANGE_PATH,
} from "@/constants/API_CONSTANTS";
import axios from "axios";

export const loginUserWithSpotify = async (
  code: string,
  redirectUri: string,
): Promise<any> => {
  const response = await axios.post(
    SPOTIFY_EXCHANGE_PATH,
    { code, redirectUri },
    {
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    },
  );
  return response;
};
