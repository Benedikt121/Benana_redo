import { InvitationStatus } from "./InviteTypes";
import { BackendSongInfo, SongInfo } from "./MusicTypes";

export interface Friend {
  musicState: SongInfo | null;
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    color: string;
    profilePictureURL: string;
  };
}

export interface getFriendsResponse {
  status: string;
  data: Friend[];
}

export interface FriendRequest {
  sender: {
    id: string;
    username: string;
    color: string;
  };
  friendship: Friendship;
}

export interface Friendship {
  id: string;
  status: InvitationStatus;
  createdAt: Date;
  senderId: string;
  receiverId: string;
}

export interface GetFriendRequestsResponse {
  status: string;
  data: FriendRequest[];
}
