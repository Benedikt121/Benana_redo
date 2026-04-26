import { Server, Socket } from "socket.io";
import {
  getMusicState,
  removeMusicState,
  setMusicState,
  UserMusicState,
} from "./utility/userMusicState.js";
import { getFriends } from "../services/friendService.js";
import {
  matchAppleToSpotify,
  matchSpotifyToApple,
} from "../services/songMatchingService.js";
import axios from "axios";
import { getValidSpotifyToken } from "../services/musicService.js";

const activeServerPollers = new Map<string, NodeJS.Timeout>();

export const registerMusicHandlers = (io: Server, socket: Socket) => {
  socket.on(
    "START_SERVER_POLLING",
    async (platform: "SPOTIFY" | "APPLE_MUSIC") => {
      const userId = socket.data.userId;
      if (!userId) return;

      // Weiche: Server-Polling funktioniert nur für Spotify!
      if (platform !== "SPOTIFY") {
        console.log(
          `[Music Sync] Server-Polling ignoriert für ${userId} (Nutzt ${platform})`,
        );
        return;
      }

      // 1. Prüfen: Gibt es überhaupt Zuhörer im Raum?
      const roomName = `music_stream_${userId}`;
      const room = io.sockets.adapter.rooms.get(roomName);

      if (!room || room.size === 0) {
        console.log(
          `[Music Sync] Kein Polling gestartet für ${userId} - Raum ist leer.`,
        );
        return;
      }

      console.log(
        `[Music Sync] Starte Spotify Server-Polling für User ${userId}...`,
      );

      // Bestehenden Poller stoppen, falls einer hängt
      if (activeServerPollers.has(userId)) {
        clearInterval(activeServerPollers.get(userId)!);
      }

      // 2. Das Polling-Intervall (z.B. alle 8 Sekunden)
      const intervalId = setInterval(async () => {
        const token = await getValidSpotifyToken(userId);
        if (!token) return;

        try {
          const response = await axios.get(
            "https://api.spotify.com/v1/me/player",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.status === 200 && response.data && response.data.item) {
            const title = response.data.item.name;
            const artist = response.data.item.artists
              .map((a: any) => a.name)
              .join(", ");
            const isPlaying = response.data.is_playing;
            const trackId = `spotify:track:${response.data.item.id}`;
            const spotifyCoverUrl = response.data.item.album?.images?.[0]?.url;
            const { appleTrackId, coverUrl: matchedCoverUrl } =
              (await matchSpotifyToApple(response.data.item.id)) as {
                appleTrackId: string;
                coverUrl: string;
              };
            const progressMs = response.data.progress_ms;

            // Daten formatieren
            const statusData: UserMusicState = {
              platform: "SPOTIFY",
              trackId: trackId,
              trackName: title,
              artist: artist,
              spotifyTrackId: trackId,
              appleTrackId: appleTrackId,
              playbackState: isPlaying ? "PLAYING" : "PAUSED",
              timestamp: progressMs,
              coverUrl: spotifyCoverUrl ?? matchedCoverUrl,
              updatedAt: Date.now(),
            };

            await setMusicState(userId, statusData);

            io.to(roomName).emit("HOST_MUSIC_SYNC", statusData);
          }
        } catch (err) {
          console.error(`[Music Sync] Fehler beim Polling für ${userId}`, err);
        }
      }, 8000);

      activeServerPollers.set(userId, intervalId);
    },
  );

  socket.on("STOP_SERVER_POLLING", () => {
    const userId = socket.data.userId;
    if (!userId) return;

    const poller = activeServerPollers.get(userId);
    if (poller) {
      console.log(
        `[Music Sync] Stoppe Server-Polling für User ${userId} (Host ist zurück)`,
      );
      clearInterval(poller);
      activeServerPollers.delete(userId);
    }
  });

  socket.on("music_status_update", async (statusData: UserMusicState) => {
    let appleId = null;
    let spotifyId = null;
    let coverUrl: string | null = null;

    const userId = socket.data.userId;
    const previousStatus = await getMusicState(userId);

    if (!userId) {
      console.error("User ID not found in socket data");
      return;
    }

    if (statusData.platform === "SPOTIFY") {
      const cleanSpotifyId = statusData.spotifyTrackId?.replace(
        "spotify:track:",
        "",
      );
      spotifyId = cleanSpotifyId;
      const match = await matchSpotifyToApple(cleanSpotifyId!);
      appleId = match?.appleTrackId ?? null;
      coverUrl = statusData.coverUrl ?? match?.coverUrl ?? null;
    } else if (statusData.platform === "APPLE_MUSIC") {
      appleId = statusData.trackId;
      const match = await matchAppleToSpotify(appleId);
      spotifyId = match?.spotifyTrackId ?? null;
      coverUrl = statusData.coverUrl ?? match?.coverUrl ?? null;
    }

    const updatedStatusData: UserMusicState = {
      ...statusData,
      appleTrackId: appleId,
      spotifyTrackId: spotifyId,
      coverUrl,
      updatedAt: Date.now(),
    };
    await setMusicState(userId, updatedStatusData);

    const songChanged = previousStatus?.trackId !== updatedStatusData.trackId;
    const playStateChanged =
      previousStatus?.playbackState !== updatedStatusData.playbackState;

    if (songChanged || playStateChanged) {
      const friends = await getFriends(userId);
      friends.forEach((friend) => {
        io.to(`user_${friend.friend.id}`).emit("friend_music_update", {
          friendId: userId,
          musicStatus: updatedStatusData,
        });
      });
    }

    io.to(`music_stream_${userId}`).emit("HOST_MUSIC_SYNC", updatedStatusData);
  });

  socket.on("JOIN_LISTENING_PARTY", async (hostUserId: string) => {
    socket.join(`music_stream_${hostUserId}`);

    const currentStatus = await getMusicState(hostUserId);
    if (currentStatus) {
      socket.emit("HOST_MUSIC_SYNC", currentStatus);
    }
  });

  socket.on("LEAVE_LISTENING_PARTY", (hostUserId: string) => {
    socket.leave(`music_stream_${hostUserId}`);

    const room = io.sockets.adapter.rooms.get(`music_stream_${hostUserId}`);
    if (!room || room.size === 0) {
      const poller = activeServerPollers.get(hostUserId);
      if (poller) {
        console.log(
          `[Music Sync] Letzter Zuhörer hat ${hostUserId} verlassen. Polling gestoppt.`,
        );
        clearInterval(poller);
        activeServerPollers.delete(hostUserId);
      }
    }
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    if (!userId) return;

    const poller = activeServerPollers.get(userId);
    if (poller) {
      clearInterval(poller);
      activeServerPollers.delete(userId);
    }

    await removeMusicState(userId);
    const friends = await getFriends(userId);
    friends.forEach((friend) => {
      io.to(`user_${friend.friend.id}`).emit("FRIEND_MUSIC_STOPPED", {
        friendId: userId,
      });
    });
  });
};
