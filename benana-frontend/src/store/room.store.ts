import { RoomInvite } from "@/types/InviteTypes";
import { create } from "zustand";

interface InvitesState {
  roomInvites: RoomInvite[];
  setRoomInvites: (invites: RoomInvite[]) => void;
}

export const useInvitesStore = create<InvitesState>((set) => ({
  roomInvites: [],
  setRoomInvites: (roomInvites) => set({ roomInvites }),
}));
