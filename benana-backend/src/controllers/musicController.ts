import { Request, Response } from "express";
import {
  getAppleDeveloperToken,
  getValidSpotifyToken,
} from "../services/musicService.js";
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

import axios from "axios";
import { matchSpotifyToApple } from "../services/songMatchingService.js";
import { UserMusicState } from "../sockets/utility/userMusicState.js";

export const testAppleMusicConnection = async (req: any, res: any) => {
  try {
    // 1. Hole den User (und seinen Apple Token) aus der DB
    const userId = req.user.id; // Vorausgesetzt, die Route ist mit 'protect' abgesichert

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.appleMusicUserToken) {
      return res.status(404).json({
        status: "error",
        message: "User hat keinen Apple Token in der DB!",
      });
    }

    // 2. Generiere den aktuellen Developer Token
    const developerToken = getAppleDeveloperToken();

    // 3. Mach den Test-Call an die offizielle Apple API
    // Wir fragen hier nach der "Storefront" (z.B. "de" für Deutschland)
    const appleResponse = await axios.get(
      "https://api.music.apple.com/v1/me/storefront",
      {
        headers: {
          Authorization: `Bearer ${developerToken}`,
          "Music-User-Token": user.appleMusicUserToken, // Hier kommt dein geretteter Token zum Einsatz!
        },
      },
    );

    // 4. Wenn wir hier ankommen, hat Apple den Token akzeptiert!
    return res.status(200).json({
      status: "success",
      message: "🔥 Apple Music Token ist GÜLTIG! 🔥",
      appleData: appleResponse.data,
    });
  } catch (error: any) {
    console.error("Apple API Error:", error.response?.data || error.message);
    return res.status(401).json({
      status: "error",
      message: "Token ist ungültig oder abgelaufen.",
      appleError: error.response?.data,
    });
  }
};

export const renderAppleMobileLogin = async (req: any, res: any) => {
  try {
    const devToken = getAppleDeveloperToken();

    // Wir senden eine fertige Webseite zurück!
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
        </head>
        <body style="background-color: #111; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: -apple-system, sans-serif;">
          <h1 style="margin-bottom: 10px;">Benana x Apple Music</h1>
          <p style="margin-bottom: 40px; opacity: 0.7; text-align: center; padding: 0 20px;">
            Klicke auf den Button, um dich sicher im System-Browser anzumelden.
          </p>
          
          <button onclick="startLogin()" id="loginBtn" style="background-color: #FA243C; color: white; padding: 16px 32px; border-radius: 12px; font-size: 18px; font-weight: bold; border: none; cursor: pointer;">
            Mit Apple Music verbinden
          </button>

          <script>
            async function startLogin() {
              const btn = document.getElementById('loginBtn');
              btn.innerText = "Lade...";
              
              try {
                const music = await MusicKit.configure({
                  developerToken: '${devToken}',
                  app: { name: 'Benana', build: '1.0.0' }
                });
                
                await music.authorize();
                const token = music.musicUserToken;
                
                // DER TRICK: Wir rufen den Deep-Link deiner App auf und hängen den Token an!
                window.location.href = 'benanafrontend://callback?appleToken=' + encodeURIComponent(token);
                
                btn.innerText = "Erfolgreich! Zurück zur App...";
              } catch (err) {
                window.location.href = 'benanafrontend://callback?error=cancelled';
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Fehler beim Laden des Apple Developer Tokens.");
  }
};

export const getCurrentSpotifySong = async (req: any, res: any) => {
  try {
    const userId = (req as any).user.id;
    const token = await getValidSpotifyToken(userId);

    if (!token)
      return res.status(401).json({ message: "No Spotify Token provided." });

    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 200 && response.data && response.data.item) {
      const title = response.data.item.name;
      const artist = response.data.item.artists
        .map((a: any) => a.name)
        .join(", ");
      const isPlaying = response.data.is_playing;
      const trackId = `spotify:track:${response.data.item.id}`;
      const progressMs = response.data.progress_ms;

      const { appleTrackId, coverUrl } = (await matchSpotifyToApple(
        response.data.item.id,
      )) as any;

      const statusData: UserMusicState = {
        platform: "SPOTIFY",
        trackId,
        trackName: title,
        artist,
        timestamp: progressMs,
        playbackState: isPlaying ? "PLAYING" : "PAUSED",
        appleTrackId,
        spotifyTrackId: response.data.item.id,
        coverUrl: coverUrl,
        updatedAt: Date.now(),
      };

      return res.status(200).json({
        success: true,
        data: statusData,
      });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Spotify API Error:", error);
    return res
      .status(500)
      .json({ message: "Interner Fehler beim Spotify Login." });
  }
};
