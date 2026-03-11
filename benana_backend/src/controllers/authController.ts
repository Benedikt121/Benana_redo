import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, getUserByUsername } from "../services/userService";
import type { authRequest, authResponse } from "../types/authTypes";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

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

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

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
    console.log("Headers:", req.headers); // Prüfen, ob Content-Type korrekt ankommt
    console.log("Body:", req.body); // Prüfen, ob hier überhaupt etwas steht
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

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

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
