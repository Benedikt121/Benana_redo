import { Server, Socket } from "socket.io";
import { registerRoomHandlers } from "./roomHandler.js";
import { registerChatHandlers } from "./chatHandler.js";
import { registerGameHandlers } from "./gameHandler.js";
import { registerMusicHandlers } from "./musicHandler.js";

export const connectedUsers = new Map<string, string>();

export const setupSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`⚡ New Client connected: ${socket.id}`);

    socket.on("register", (userId: string) => {
      connectedUsers.set(userId, socket.id);
      socket.data.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`👤 User ${userId} registered with Socket ${socket.id}`);
    });

    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerMusicHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });
};
