import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
  getUserById,
  getUserByUsername,
  getAllUsernams,
  getUsersByUsernameQuery,
  updateUserColorOrAvatar,
} from "../services/userService.js";
import { getValidSpotifyToken } from "../services/musicService.js";

export const getMyUserProfile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const appleToken: string | null = user.appleMusicUserToken || null;

    let spotifyAccessToken = null;
    if (user.spotifyRefreshToken) {
      spotifyAccessToken = await getValidSpotifyToken(user.id);
    }
    const safeUser = {
      id: user.id,
      username: user.username,
      color: user.color,
      profilePictureUrl: user.profilePictureUrl,
      createdAt: user.createdAt,
      currentRoomId: user.currentRoomId,
      isReady: user.isReady,
      appleMusicUserToken: appleToken,
      spotifyAccessToken: spotifyAccessToken,
      isAppleLinked: !!appleToken,
      isSpotifyLinked: !!user.spotifyRefreshToken,
    };
    res.status(200).json({ status: "success", data: safeUser });
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
export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ status: "error", message: "No file uploaded" });
    }

    const profilePictureUrl = `/public/uploads/${file.filename}`;

    const user = (req as any).user;
    if (user.profilePictureUrl) {
      const oldPath = path.join(process.cwd(), user.profilePictureUrl);
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.error("Error deleting old profile picture:", err);
      }
    }

    const updatedUser = await updateUserColorOrAvatar(
      userId,
      undefined,
      profilePictureUrl,
    );

    res.status(200).json({ status: "success", data: updatedUser });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to upload profile picture" });
  }
};
