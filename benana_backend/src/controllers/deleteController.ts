import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { getUserByUsername, deleteUser } from "../services/userService.js";
import type { authRequest } from "../types/authTypes.js";

export const deleteUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username, clientPasswordHash }: authRequest = req.body;
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const isPasswordValid = await bcrypt.compare(
      clientPasswordHash,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    await deleteUser(username);
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
