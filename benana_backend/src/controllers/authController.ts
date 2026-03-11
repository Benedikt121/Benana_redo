import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  getUserByUsername,
  deleteUserById,
  getUserById,
} from "../services/userService.js";
import type { authRequest, authResponse } from "../types/authTypes.js";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}
if (!process.env.JWT_EXPIRES_IN) {
  throw new Error("JWT_EXPIRES_IN is not defined in environment variables");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env
  .JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"];

const signToken = (id: number) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, clientPasswordHash }: authRequest = req.body;

    if (!username || !clientPasswordHash) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const saltRounds = 10;
    const serverSafeHash = await bcrypt.hash(clientPasswordHash, saltRounds);

    const newUser = await createUser(username, serverSafeHash);

    const token = signToken(newUser.id);

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, clientPasswordHash }: authRequest = req.body;

    if (!username || !clientPasswordHash) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const isPasswordValid = await bcrypt.compare(
      clientPasswordHash,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = signToken(user.id);

    res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      return res.status(404).json({ message: "User not found." });
    }
    await deleteUserById(user.id);

    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      status: "success",
      message: "Erfolgreich abgemeldet.",
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Fehler beim Logout" });
  }
};
