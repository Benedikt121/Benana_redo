import {
  FRIEND_REQUESTS_PATH,
  getAuthHeaders,
} from "./../constants/API_CONSTANTS";
import { FRIEND_PATH } from "@/constants/API_CONSTANTS";
import {
  FriendActionResponse,
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

export const sendFriendRequest = async (
  username: string,
): Promise<FriendActionResponse> => {
  const response = await axios.post<FriendActionResponse>(
    `${FRIEND_PATH}request`,
    { username },
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const acceptFriendRequest = async (
  friendshipId: string,
): Promise<FriendActionResponse> => {
  const response = await axios.patch<FriendActionResponse>(
    `${FRIEND_PATH}accept/${friendshipId}`,
    {},
    { headers: getAuthHeaders() },
  );
  return response.data;
};

export const removeFriend = async (
  friendshipId: string,
): Promise<FriendActionResponse> => {
  const response = await axios.delete<FriendActionResponse>(
    `${FRIEND_PATH}remove/${friendshipId}`,
    {
      headers: getAuthHeaders(),
    },
  );
  return response.data;
};
