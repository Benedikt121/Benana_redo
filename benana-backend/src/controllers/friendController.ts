import { Request, Response } from "express";
import * as friendService from "../services/friendService.js";
import { getMusicState } from "../sockets/utility/userMusicState.js";
import { connectedUsers } from "../sockets/index.js";

export const requestFriend = async (req: Request, res: Response) => {
  try {
    const senderId = (req as any).user.id;
    const { username }: { username: string } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ status: "error", message: "Username is required." });
    }

    const friendship = await friendService.sendFriendRequest(
      senderId,
      username,
    );

    // Emit socket event to the receiver
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${friendship.receiverId}`).emit(
        "friendRequestReceived",
        friendship,
      );
    }

    res.status(201).json({ status: "success", data: friendship });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage === "Receiver not found")
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    if (errorMessage === "You cannot send a friend request to yourself")
      return res.status(400).json({
        status: "error",
        message: "You cannot send a friend request to yourself.",
      });
    if (errorMessage === "You are already friends with this user")
      return res.status(400).json({
        status: "error",
        message: "You are already friends with this user.",
      });

    console.error("Error sending friend request:", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

export const getRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const requests = await friendService.getPendingFriendRequests(userId);
    res.status(200).json({ status: "success", data: requests });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

export const getFriendsList = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const friends = await friendService.getFriends(userId);

    const friendsWithMusicState = await Promise.all(
      friends.map(async (friend) => {
        const liveMusicState = await getMusicState(friend.friend.id);
        const isOnline = connectedUsers.has(friend.friend.id);
        return {
          ...friend,
          musicState: liveMusicState,
          isOnline: isOnline,
        };
      }),
    );
    res.status(200).json({ status: "success", data: friendsWithMusicState });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

export const acceptRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const friendshipId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const accepted = await friendService.acceptFriendRequest(
      friendshipId,
      userId,
    );

    // Emit socket event to the sender (now friend)
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${accepted.senderId}`).emit(
        "friendRequestAccepted",
        accepted,
      );
    }

    res.status(200).json({ status: "success", data: accepted });
  } catch (error: any) {
    if (error.message === "Friendship not found") {
      return res
        .status(404)
        .json({ status: "error", message: "Friend request not found." });
    }
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};

export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const friendshipId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    await friendService.deleteFriendship(friendshipId, userId);
    res
      .status(200)
      .json({ status: "success", message: "Friend removed successfully." });
  } catch (error: any) {
    if (error.message === "You are not authorized to delete this friendship") {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete this friendship.",
      });
    }
    console.log("Error deleting friendship:", error);
    res
      .status(500)
      .json({ status: "error", message: "Internal server error." });
  }
};
