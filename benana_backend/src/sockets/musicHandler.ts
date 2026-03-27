import { Server, Socket } from "socket.io";
import {
  getMusicState,
  removeMusicState,
  setMusicState,
  UserMusicState,
} from "./utility/userMusicState.js";
import { getFriends } from "../services/friendService.js";
export const registerMusicHandlers = (io: Server, socket: Socket) => {
  const userId = socket.data.userId;

  if (!userId) {
    console.error("User ID not found in socket data");
    return;
  }

  socket.on("music_status_update", async (statusData: UserMusicState) => {
    await setMusicState(userId, { ...statusData, updatedAt: Date.now() });

    const friends = await getFriends(userId);
    friends.forEach((friend) => {
      io.to(`user_${friend.friend.id}`).emit("friend_music_update", {
        friendId: userId,
        musicStatus: statusData,
      });
    });
    io.to(`music_stream_${userId}`).emit("HOST_MUSIC_SYNC", statusData);
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
