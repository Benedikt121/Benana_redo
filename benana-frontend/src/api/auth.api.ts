import axios from "axios";
import { API_PREFIX } from "../constants/API_CONSTANTS";
import { AuthResponse, Credentials } from "@/types/AuthTypes";

export const loginUser = async (
  credentials: Credentials,
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(
    `${API_PREFIX}auth/login`,
    credentials,
  );
  return response.data;
};
