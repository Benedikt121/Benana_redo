import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { getUserByUsername, deleteUserById } from "../services/userService.js";
import type { authRequest } from "../types/authTypes.js";
import { deleteRoom, getRoom } from "../services/roomService.js";

export const deleteUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username, clientPasswordHash }: authRequest = req.body;
    const user = await getUserByUsername(username, true);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    }
    const isPasswordValid = await bcrypt.compare(
      clientPasswordHash,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid username or password." });
    }
    await deleteUserById(user.id);
    res
      .status(200)
      .json({ status: "success", message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

export const removeRoom = async (req: Request, res: Response) => {
  try {
    const roomId = Array.isArray(req.params.roomId)
      ? req.params.roomId[0]
      : req.params.roomId;
    if (!roomId) {
      return res
        .status(400)
        .json({ status: "error", message: "Room ID is required." });
    }
    const room = await getRoom(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ status: "error", message: "Room not found." });
    }
    if (room.hostId !== (req as any).user.id) {
      return res.status(403).json({
        status: "error",
        message: "Only the host can delete the room.",
      });
    }
    const deletedRoom = await deleteRoom(roomId);
    res.status(200).json({ status: "success", data: deletedRoom });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to remove room" });
  }
};
