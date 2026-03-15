import {
  addPlayerToRoom,
  createRoom,
  deleteRoom,
  findInvitationsForRoom,
  getRoom,
  getRooms,
  removePlayerFromRoom,
  updateRoomStatus,
} from "../services/roomService.js";
import { checkFriendship } from "../services/friendService.js";
import { Request, Response } from "express";
import { getUserById, updateIsReady } from "../services/userService.js";
import {
  createMatchForRoom,
  createMatchGame,
  createOlympiade,
  getGameDefinitionByName,
  getMatchGameDefinitionByName,
} from "../services/gameService.js";

export const newRoom = async (req: Request, res: Response) => {
  try {
    const hostId = (req as any).user.id;

    const createdRoom = await createRoom(hostId);
    await addPlayerToRoom(createdRoom.id, hostId);
    if ((req as any).user.currentRoomId) {
      const updatedRoom = await removePlayerFromRoom(
        (req as any).user.currentRoomId,
        hostId,
      );
      const shouldDeleteRoom =
        updatedRoom.participants.length === 0 || updatedRoom.hostId === hostId;

      if (shouldDeleteRoom) {
        await deleteRoom((req as any).user.currentRoomId);
      }
    }
    res.status(201).json({ status: "success", data: createdRoom });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to create room" });
  }
};

export const getAllRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await getRooms();
    if (rooms.length === 0) {
      return res
        .status(200)
        .json({ status: "success", message: "No rooms available.", data: [] });
    }
    res.status(200).json({ status: "success", data: rooms });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch rooms" });
  }
};

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId)
      ? req.params.roomId[0]
      : req.params.roomId;

    const room = await getRoom(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ status: "error", message: "Room not found." });
    }
    res.status(200).json({ status: "success", data: room });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch room" });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId)
      ? req.params.roomId[0]
      : req.params.roomId;
    const userId = (req as any).user.id;

    if ((req as any).user.currentRoomId === roomId) {
      return res
        .status(400)
        .json({ status: "error", message: "You are already in this room." });
    }

    const room = await getRoom(roomId);
    if (room?.whoCanJoin === "INVITE_ONLY") {
      return res.status(403).json({
        status: "error",
        message:
          "This room is invite-only. You cannot join without an invitation.",
      });
    }
    if (room?.whoCanJoin === "FRIENDS_ONLY") {
      const isFriend = await checkFriendship(userId, room.hostId);

      if (!isFriend && userId !== room.hostId) {
        return res.status(403).json({
          status: "error",
          message:
            "This room is for friends only. You cannot join without being a friend.",
        });
      }
    }
    if (room?.status !== "CREATING") {
      return res.status(400).json({
        status: "error",
        message: "This room is not available for joining.",
      });
    }

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

    const updatedRoom = await addPlayerToRoom(roomId, userId);
    res.status(200).json({ status: "success", data: updatedRoom });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to join room" });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const roomId = (req as any).user.currentRoomId;

    if (!roomId) {
      return res
        .status(400)
        .json({ status: "error", message: "You are not currently in a room." });
    }

    const updatedRoom = await removePlayerFromRoom(roomId, userId);
    const shouldDeleteRoom =
      updatedRoom.participants.length === 0 || updatedRoom.hostId === userId;

    if (shouldDeleteRoom) {
      await deleteRoom(roomId);
      return res.status(200).json({
        status: "success",
        message: "Room deleted as it has no participants or host left.",
      });
    }
    res.status(200).json({ status: "success", data: updatedRoom });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to leave room" });
  }
};

export const kickPlayer = async (req: Request, res: Response) => {
  try {
    const hostId = (req as any).user.id;
    const { userId: targetUserId } = req.params;
    const roomId = (req as any).user.currentRoomId;

    if (hostId === targetUserId) {
      return res.status(400).json({
        status: "error",
        message: "You can't kick yourself",
      });
    }

    const room = await getRoom(roomId as string);

    if (room?.hostId !== hostId) {
      return res.status(403).json({
        status: "error",
        message: "Only the host can kick players",
      });
    }

    if (room?.status !== "CREATING") {
      return res.status(400).json({
        status: "error",
        message: "You can only kick players in the Lobby",
      });
    }

    const isPlayerInRoom = room.participants.some((p) => p.id === targetUserId);
    if (!isPlayerInRoom) {
      return res.status(400).json({
        status: "error",
        message: "This player is not in your room",
      });
    }

    await removePlayerFromRoom(roomId as string, targetUserId as string);

    res.status(200).json({
      status: "success",
      message: "Player kicked successfully",
    });
  } catch (error) {
    console.error("Error in kickPlayer:", error);
    res.status(500).json({ status: "error", message: "Failed to kick player" });
  }
};

export const getRoomInvites = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId)
      ? req.params.roomId[0]
      : req.params.roomId;

    const invites = await findInvitationsForRoom(roomId);
    res.status(200).json({ status: "success", data: invites });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch invitations." });
  }
};

export const startRoom = async (req: Request, res: Response) => {
  try {
    const roomId = (req as any).user.currentRoomId;
    const userId = (req as any).user.id;

    const { gameType, isAnalog, olyGames, olyMode, matchGame } = req.body;

    const room = await getRoom(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ status: "error", message: "Failed to find room" });
    }

    if (room.hostId !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Only the host can start the game.",
      });
    }

    if (room.status !== "CREATING") {
      return res
        .status(400)
        .json({ status: "error", message: "Room was already started." });
    }

    const unreadyPlayers = room.participants.filter((p) => !p.isReady);
    if (unreadyPlayers.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Not everyone is ready yet",
      });
    }

    let startedGameData;

    if (gameType === "KNIFFEL") {
      const gameDef = await getGameDefinitionByName("KNIFFEL");
      const matchGameId = await getMatchGameDefinitionByName(matchGame);
      startedGameData = await createMatchForRoom(
        roomId,
        gameDef!.id,
        userId,
        isAnalog || false,
        matchGameId!.id,
      );
    } else if (gameType === "OLYMPIADE") {
      if (!olyGames || olyGames.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Olympiads need atleast one game",
        });
      }

      await updateRoomStatus(roomId, "ACTIVE");

      startedGameData = createOlympiade(roomId, olyMode, olyGames);
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Unknown gametype" });
    }

    res.status(200).json({ status: "success", data: startedGameData });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to start room" });
  }
};

export const toggleReady = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await getUserById(userId);

    if (!user || !user.currentRoomId) {
      return res
        .status(400)
        .json({ status: "error", message: "You aren't in any room." });
    }

    const updatedUser = await updateIsReady(userId, !user.isReady);

    res.status(200).json({ status: "success", data: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to toggle ready status" });
  }
};