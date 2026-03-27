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
  const userId = socket.data.userId;

  if (!userId) {
    console.error("User ID not found in socket data");
    return;
  }

  socket.on("music_status_update", async (statusData: UserMusicState) => {
    let appleId = null;
    let spotifyId = null;

    if (statusData.platform === "SPOTIFY") {
      const cleanSpotifyId = statusData.spotifyTrackId?.replace(
        "spotify:track:",
        "",
      );
      spotifyId = cleanSpotifyId;
      appleId = await matchSpotifyToApple(cleanSpotifyId!);
    } else if (statusData.platform === "APPLE_MUSIC") {
      appleId = statusData.trackId;
      spotifyId = await matchAppleToSpotify(appleId);
    }

    const updatedStatusData: UserMusicState = {
      ...statusData,
      appleTrackId: appleId,
      spotifyTrackId: spotifyId,
      updatedAt: Date.now(),
    };
    await setMusicState(userId, updatedStatusData);

    const friends = await getFriends(userId);
    friends.forEach((friend) => {
      io.to(`user_${friend.friend.id}`).emit("friend_music_update", {
        friendId: userId,
        musicStatus: updatedStatusData,
      });
    });
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
    await removeMusicState(userId);
    const friends = await getFriends(userId);
    friends.forEach((friend) => {
      io.to(`user_${friend.friend.id}`).emit("FRIEND_MUSIC_STOPPED", {
        friendId: userId,
      });
    });
  });
};
