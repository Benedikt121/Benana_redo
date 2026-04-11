import { getAuthHeaders } from "./../constants/API_CONSTANTS";
import { ME_PATH } from "@/constants/API_CONSTANTS";
import { MeResponse } from "@/types/UserTypes";
import axios from "axios";

export const getMe = async (): Promise<MeResponse> => {
  const response = await axios.get<MeResponse>(ME_PATH, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
