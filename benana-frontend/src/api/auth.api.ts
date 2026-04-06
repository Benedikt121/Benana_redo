import axios from "axios";
import {
  LOGIN_PATH,
  LOGOUT_PATH,
  REGISTER_PATH,
} from "../constants/API_CONSTANTS";
import { AuthResponse, Credentials, LogoutResponse } from "@/types/AuthTypes";

export const loginUser = async (
  credentials: Credentials,
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(LOGIN_PATH, credentials);
  return response.data;
};

export const registerUser = async (
  credentials: Credentials,
): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(REGISTER_PATH, credentials);
  return response.data;
};

export const logoutUser = async (): Promise<LogoutResponse> => {
  const response = await axios.post<LogoutResponse>(LOGOUT_PATH);
  return response.data;
};
