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
export const uploadProfilePicture = async (uri: string): Promise<MeResponse> => {
  const formData = new FormData();

  // Handle hybrid environment (web vs mobile)
  const filename = uri.split("/").pop();
  const match = /\.(\w+)$/.exec(filename || "");
  const type = match ? `image/${match[1]}` : `image`;

  formData.append("avatar", {
    uri: uri,
    name: filename || "avatar.png",
    type,
  } as any);

  const response = await axios.post<MeResponse>(`${ME_PATH}/avatar`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
