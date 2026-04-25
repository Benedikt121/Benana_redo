import { InvitationStatus } from "./InviteTypes";
import { BackendSongInfo, SongInfo } from "./MusicTypes";

export interface Friend {
  musicState: SongInfo | null;
  isOnline: boolean;
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    color: string;
    profilePictureUrl: string;
  };
}

export interface getFriendsResponse {
  status: string;
  data: Friend[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    color: string;
    profilePictureUrl: string;
  };
  receiver?: {
    username: string;
  };
}

export interface GetFriendRequestsResponse {
  status: string;
  data: FriendRequest[];
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
}

export interface FriendActionResponse {
  status: string;
  data?: Friendship;
  message?: string;
}
