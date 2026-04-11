import { Friend } from "@/types/FriendTypes";
import { SongInfo } from "@/types/MusicTypes";
import { create } from "zustand";

interface FriendsState {
  friends: Friend[];

  setFriends: (friends: Friend[]) => void;
  setFriendSong: (friendId: string, song: SongInfo) => void;
  clearFriendSong: (friendId: string) => void;
}

export const useFriendsStore = create<FriendsState>((set) => ({
  friends: [],

  setFriends: (friends) => set({ friends }),

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
