import { RoomStatus, WhoCanJoin, InviteRoom, RoomParticipant, UpdatedRoom } from "./RoomTypes";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface RoomInvite {
  id: string;
  status: InvitationStatus;
  createdAt: Date;
  senderId: string;
  receiverId: string;
  roomId: string;
}

export interface InviteSender {
  id: string;
  username: string;
  color: string;
}

export interface RoomInviteWithDetails extends RoomInvite {
  sender: InviteSender;
  room: InviteRoom;
}

export interface GetInvitesResponse {
  status: string;
  data: RoomInviteWithDetails[];
}

export interface CreateInviteResponse {
  status: string;
  data: RoomInvite;
}

export interface UpdateInviteResponse {
  status: string;
  data: {
    invite: RoomInvite;
    updatedRoom: UpdatedRoom;
  };
}
