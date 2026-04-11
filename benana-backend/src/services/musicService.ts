import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import axios from "axios";

const teamId = process.env.APPLE_TEAM_ID!;
const keyId = process.env.APPLE_KEY_ID!;

const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

export const getAppleDeveloperToken = (): string => {
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
