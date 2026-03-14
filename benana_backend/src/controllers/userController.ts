import { Request, Response } from "express";
import {
  getUserById,
  getUserByUsername,
  getAllUsernams,
  getUsersByUsernameQuery,
  updateUserColorOrAvatar,
} from "../services/userService.js";

export const getMyUserProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.status(200).json({ status: "success", data: user });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch user profile" });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { color, avatar } = req.body;

    const updatedUser = await updateUserColorOrAvatar(userId, color, avatar);
    res.status(200).json({ status: "success", data: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to update user profile" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;

    const username = Array.isArray(req.params.username)
      ? req.params.username[0]
      : req.params.username;

    const user = userId
      ? await getUserById(userId)
      : await getUserByUsername(username);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    res.status(200).json({ status: "success", data: user });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch user profile" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid search query" });
    }

    const users = await getUsersByUsernameQuery(q, currentUserId);
    res.status(200).json({ status: "success", data: users });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to search users" });
  }
};

export const searchUsersAutoComplete = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const users = await getAllUsernams(currentUserId);
    res.status(200).json({ status: "success", data: users });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to search users" });
  }
};
