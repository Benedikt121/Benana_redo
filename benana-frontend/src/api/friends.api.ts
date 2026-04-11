import {
  FRIEND_REQUESTS_PATH,
  getAuthHeaders,
} from "./../constants/API_CONSTANTS";
import { FRIEND_PATH } from "@/constants/API_CONSTANTS";
import {
  GetFriendRequestsResponse,
  getFriendsResponse,
} from "@/types/FriendTypes";
import axios from "axios";

export const getFriends = async (): Promise<getFriendsResponse> => {
  const response = await axios.get<getFriendsResponse>(FRIEND_PATH, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getFriendRequests =
  async (): Promise<GetFriendRequestsResponse> => {
    const reponse = await axios.get<GetFriendRequestsResponse>(
      FRIEND_REQUESTS_PATH,
      { headers: getAuthHeaders() },
    );
    return reponse.data;
  };
