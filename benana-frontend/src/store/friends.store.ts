import { Friend } from "@/types/FriendTypes";
import { SongInfo } from "@/types/MusicTypes";

interface friendsState {
  friends: Friend[];

  setFriends(): (friends: Friend[]) => void;
  setFriendSong(): (friendId: string, song: SongInfo) => void;
  clearFriendSong(): (friendId: string) => void;
}
