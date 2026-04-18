import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import axios from "axios";
import path from "path";
import fs from "fs";

const teamId = process.env.APPLE_TEAM_ID!;
const keyId = process.env.APPLE_KEY_ID!;

export const getAppleDeveloperToken = (): string => {
  try {
    if (!teamId || !keyId) {
      console.error(
        "[Music Sync] Apple Developer Credentials fehlen in der .env Datei!",
      );
      throw new Error("Missing Apple credentials");
    }

    const keyPath = path.join(process.cwd(), `AuthKey_${keyId}.p8`);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Die Datei ${keyPath} wurde nicht gefunden!`);
    }
    const privateKey = fs.readFileSync(keyPath, "utf8");

    const token = jwt.sign({}, privateKey, {
      algorithm: "ES256",
      expiresIn: "30d",
      issuer: teamId,
      header: {
        alg: "ES256",
        kid: keyId,
      },
    });

    return token;
  } catch (error) {
    console.error("Error while signing the Apple Token");
    throw error;
  }
};

export const getValidSpotifyToken = async (
  userId: string,
): Promise<string | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { spotifyRefreshToken: true },
    });

    if (!user || !user.spotifyRefreshToken) {
      console.error(`[Music Sync] No spotify Refresh-Token for user ${userId}`);
      return null;
    }

    const authOptions = {
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET,
          ).toString("base64"),
      },
      data: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.spotifyRefreshToken,
      }).toString(),
    };

    const response = await axios(authOptions);

    return response.data.access_token;
  } catch (error) {
    console.error(
      `[Music Sync] Error fetching the refreshtoken for ${userId}:`,
      error,
    );
    return null;
  }
};
