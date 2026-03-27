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

export const spotifyLogin = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const scope =
      "user-read-playback-state user-modify-playback-state streaming user-read-email user-read-private";

    const state = crypto.randomBytes(16).toString("hex");
    await redisClient.set(`spotify_state:${state}`, userId, { EX: 600 });

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", process.env.SPOTIFY_CLIENT_ID!);
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append(
      "redirect_uri",
      process.env.SPOTIFY_REDIRECT_URI!,
    );

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error initiating Spotify login:", error);
    res
      .status(500)
      .json({ status: "error", message: "Could not initiate Spotify login" });
  }
};

export const spotifyCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code) {
    return res
      .status(400)
      .json({ status: "error", message: "Authorization code is missing" });
  }
  try {
    const userId = await redisClient.get(`spotify_state:${state}`);
    if (!userId) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or expired state" });
    }
    await redisClient.del(`spotify_state:${state}`);

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
          code: code,
          redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as SpotifyTokenResponse;

    if (tokenData.error) {
      throw new Error(
        `Spotify token exchange failed: ${tokenData.error_description}`,
      );
    }

    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = (await userResponse.json()) as SpotifyUserResponse;

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          spotifyId: userData.id,
          spotifyRefreshToken: tokenData.refresh_token,
        },
      });
    }
    res.redirect(
      `http://localhost:5173/music?spotify_success=true&access_token=${tokenData.access_token}`,
    );
  } catch (error) {
    console.error("Spotify OAuth Error:", error);
    res.redirect(`http://localhost:5173/music?spotify_success=false`);
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
