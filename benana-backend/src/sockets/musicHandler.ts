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
export const registerMusicHandlers = (io: Server, socket: Socket) => {
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
      coverUrl = match?.coverUrl ?? statusData.coverUrl ?? null;
    } else if (statusData.platform === "APPLE_MUSIC") {
      appleId = statusData.trackId;
      const match = await matchAppleToSpotify(appleId);
      spotifyId = match?.spotifyTrackId ?? null;
      coverUrl = match?.coverUrl ?? statusData.coverUrl ?? null;
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
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    if (!userId) return;

    await removeMusicState(userId);
    const friends = await getFriends(userId);
    friends.forEach((friend) => {
      io.to(`user_${friend.friend.id}`).emit("FRIEND_MUSIC_STOPPED", {
        friendId: userId,
      });
    });
  });
};
