import { Request, Response } from "express";
import {
  createInvite,
  findInvitationById,
  findInvitationsForUser,
  updateInvitation,
} from "../services/inviteService.js";
import {
  addPlayerToRoom,
  deleteRoom,
  getRoom,
  removePlayerFromRoom,
} from "../services/roomService.js";
import { joinRoom } from "./roomController.js";

export const inviteToRoom = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const { roomId, receiverUsername } = req.body;

    const room = await getRoom(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ status: "error", message: "Room not found" });
    }

    if (!room.participants.some((participant) => participant.id === senderId)) {
      return res.status(403).json({
        status: "error",
        message: "You are not a member of this room.",
      });
    }

    if (
      room.participants.some(
        (participant) => participant.username === receiverUsername,
      )
    ) {
      return res.status(400).json({
        status: "error",
        message: "The user is already a member of this room.",
      });
    }
    const invitation = await createInvite(roomId, senderId, receiverUsername);
    if (!invitation) {
      return res
        .status(400)
        .json({ status: "error", message: "Failed to send invitation." });
    }
    res.status(201).json({ status: "success", data: invitation });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to send invitation." });
  }
};

export const getUserInvites = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const invites = await findInvitationsForUser(userId);

    res.status(200).json({ status: "success", data: invites });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch invitations." });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const inviteId = Array.isArray(req.params.inviteId)
      ? req.params.inviteId[0]
      : req.params.inviteId;
    const userId = (req as any).user.id;

    const invite = await findInvitationById(inviteId);
    if (!invite) {
      return res
        .status(404)
        .json({ status: "error", message: "Invitation not found." });
    }
    if (invite.receiverId !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to accept this invitation.",
      });
    }

    const acceptedInvite = await updateInvitation(inviteId, "ACCEPTED");
    if ((req as any).user.currentRoomId) {
      const updatedRoom = await removePlayerFromRoom(
        (req as any).user.currentRoomId,
        userId,
      );
      const shouldDeleteRoom =
        updatedRoom.participants.length === 0 || updatedRoom.hostId === userId;

      if (shouldDeleteRoom) {
        await deleteRoom((req as any).user.currentRoomId);
      }
    }

    const updatedRoom = await addPlayerToRoom(invite.roomId, userId);
    res.status(200).json({
      status: "success",
      data: { acceptedInvite: acceptedInvite, updatedRoom: updatedRoom },
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to accept invitation." });
  }
};

export const rejectInvite = async (req: Request, res: Response) => {
  try {
    const inviteId = Array.isArray(req.params.inviteId)
      ? req.params.inviteId[0]
      : req.params.inviteId;
    const userId = (req as any).user.id;

    const invite = await findInvitationById(inviteId);
    if (!invite) {
      return res
        .status(404)
        .json({ status: "error", message: "Invitation not found." });
    }
    if (invite.receiverId !== userId) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to reject this invitation.",
      });
    }

    const rejectedInvite = await updateInvitation(inviteId, "REJECTED");
    res.status(200).json({ status: "success", data: rejectedInvite });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to reject invitation." });
  }
};
