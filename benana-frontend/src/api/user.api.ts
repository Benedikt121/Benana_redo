import { Platform } from "react-native";
import {
  getAuthHeaders,
  USER_BY_ID_PATH,
  USER_BY_NAME_PATH,
} from "./../constants/API_CONSTANTS";
import { ME_PATH } from "@/constants/API_CONSTANTS";
import { getUserResponse, MeResponse } from "@/types/UserTypes";
import axios from "axios";

export const getMe = async (): Promise<MeResponse> => {
  const response = await axios.get<MeResponse>(ME_PATH, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
export const uploadProfilePicture = async (
  uri: string,
): Promise<MeResponse> => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.split("/").pop() || "avatar.jpg";
    formData.append("avatar", blob, filename);
  } else {
    const filename = uri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename || "");
    const type = match ? `image/${match[1]}` : `image`;

    formData.append("avatar", {
      uri: uri,
      name: filename || "avatar.png",
      type,
    } as any);
  }

  const response = await axios.post<MeResponse>(`${ME_PATH}/avatar`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateMe = async (data: {
  color?: string;
  avatar?: string;
}): Promise<getUserResponse> => {
  const response = await axios.patch<getUserResponse>(ME_PATH, data, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getUser = async (
  userId?: string,
  username?: string,
): Promise<getUserResponse> => {
  const searchBy = userId ? userId : username ? username : null;
  let path = "";

  if (searchBy === userId) path = USER_BY_ID_PATH(userId);
  else if (searchBy === username) path = USER_BY_NAME_PATH(username);
  else throw new Error("No Id or Username was provided.");

  const response = await axios.get<getUserResponse>(path, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateColor = async (color: string): Promise<getUserResponse> => {
  const response = await axios.patch(
    ME_PATH,
    { color: color },
    {
      headers: getAuthHeaders(),
    },
  );
  return response.data;
};
