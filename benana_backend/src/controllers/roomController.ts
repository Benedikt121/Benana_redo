import {
  addPlayerToRoom,
  createRoom,
  deleteRoom,
  getRoom,
  getRooms,
  removePlayerFromRoom,
} from "../services/roomService.js";
import { Request, Response } from "express";

export const newRoom = async (req: Request, res: Response) => {
  try {
    const hostId = (req as any).user.id;

    const createdRoom = await createRoom(hostId);
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

    const updatedRoom = await addPlayerToRoom(roomId, userId);
    res.status(200).json({ status: "success", data: updatedRoom });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to join room" });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId)
      ? req.params.roomId[0]
      : req.params.roomId;
    const userId = (req as any).user.id;

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

export const removeRoom = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId)
      ? req.params.roomId[0]
      : req.params.roomId;
    const deletedRoom = await deleteRoom(roomId);
    res.status(200).json({ status: "success", data: deletedRoom });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to remove room" });
  }
};
