import { Friend, FriendRequest } from "@/types/FriendTypes";
import { SongInfo } from "@/types/MusicTypes";
import { create } from "zustand";

interface FriendsState {
  friends: Friend[];
  friendRequests: FriendRequest[];

  setFriends: (friends: Friend[]) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  setFriendSong: (friendId: string, song: SongInfo) => void;
  clearFriendSong: (friendId: string) => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],
  friendRequests: [],

  setFriends: (friends) => set({ friends }),

  setFriendRequests: (friendRequests) => set({ friendRequests }),

  setFriendSong: (friendId, song) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.friend.id === friendId ? { ...friend, SongInfo: song } : friend,
      ),
    })),

  clearFriendSong: (friendId) =>
    set((state) => ({
      friends: state.friends.map((friend) =>
        friend.friend.id === friendId ? { ...friend, SongInfo: null } : friend,
      ),
    })),
}));
