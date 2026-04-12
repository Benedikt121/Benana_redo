import { Request, Response } from "express";
import { getAppleDeveloperToken } from "../services/musicService.js";
import { prisma } from "../config/db.js";
import crypto from "crypto";
import { redisClient } from "../config/redis.js";

interface SpotifyTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface SpotifyUserResponse {
  id?: string;
  display_name?: string;
  email?: string;
  error?: { status: number; message: string };
}

export const getAppleToken = (req: Request, res: Response) => {
  try {
    const token = getAppleDeveloperToken();
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error creating Apple token:", error);
    res
      .status(500)
      .json({ status: "error", message: "Could not generate Apple token" });
  }
};

export const saveAppleMusicToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { appleMusicToken } = req.body;

    if (!appleMusicToken) {
      return res
        .status(400)
        .json({ status: "error", message: "Apple Music token is required" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { appleMusicUserToken: appleMusicToken },
    });

    res
      .status(200)
      .json({ status: "success", message: "Apple Music token saved" });
  } catch (error) {
    console.error("Error saving Apple Music token:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to save Apple Music token" });
  }
};

export const refreshSpotifyToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { spotifyRefreshToken: true },
    });

    if (!user || !user.spotifyRefreshToken) {
      return res.status(400).json({
        status: "error",
        message: "No Spotify refresh token found for user",
      });
    }

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
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
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: user.spotifyRefreshToken,
        }),
      },
    );

    const data = (await tokenResponse.json()) as SpotifyTokenResponse;
    if (!tokenResponse.ok) {
      throw new Error(
        `Spotify token refresh failed: ${data.error_description}`,
      );
    }

    if (data.refresh_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { spotifyRefreshToken: data.refresh_token },
      });
    }

    res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    res
      .status(500)
      .json({ status: "error", message: "Failed to refresh Spotify token" });
  }
};

export const exchangeSpotifyToken = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
      return res.status(400).json({ message: "Code und Redirect URI fehlen." });
    }

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
            ).toString("base64"),
        },
        body: new URLSearchParams({
          code,
          redirect_uri: redirectUri, // Hier wird die dynamische URI genutzt
          grant_type: "authorization_code",
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as {
      error_description: string;
      refresh_token: string;
      access_token: string;
      expires_in: number;
    };

    if (!tokenResponse.ok) throw new Error(tokenData.error_description);

    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const userData = (await userResponse.json()) as { id: string };

    // Phase 2: Refresh Token für das Server-Polling speichern!
    await prisma.user.update({
      where: { id: userId },
      data: {
        spotifyRefreshToken: tokenData.refresh_token,
        spotifyId: userData.id,
      },
    });

    res.status(200).json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    });
  } catch (error) {
    console.error("Spotify Exchange Error:", error);
    res.status(500).json({ message: "Interner Fehler beim Spotify Login." });
  }
};
