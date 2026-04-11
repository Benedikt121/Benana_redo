import { getAuthHeaders, INVITE_PATH } from "@/constants/API_CONSTANTS";
import { GetInvitesResponse } from "@/types/InviteTypes";
import axios from "axios";

export const getInvites = async (): Promise<GetInvitesResponse> => {
  const response = await axios.get<GetInvitesResponse>(INVITE_PATH, {
    headers: getAuthHeaders(),
  });
  return response.data;
};
