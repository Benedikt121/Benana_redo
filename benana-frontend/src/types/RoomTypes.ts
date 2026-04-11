export type RoomStatus = "CREATING" | "ACTIVE" | "CLOSED";

export type WhoCanJoin = "PUBLIC" | "INVITE_ONLY" | "FRIENDS_ONLY";

export interface InviteRoom {
  id: string;
  hostId: string;
}

export interface RoomParticipant {
  username: string;
}

export interface UpdatedRoom {
  id: string;
  status: RoomStatus;
  createdAt: Date;
  inviteCode: string | null;
  whoCanJoin: WhoCanJoin;
  hostId: string;
  participants: RoomParticipant[];
}
