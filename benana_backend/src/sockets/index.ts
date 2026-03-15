import { Server, Socket } from "socket.io";
import { registerRoomHandlers } from "./roomHandler.js";
import { registerChatHandlers } from "./chatHandler.js";
import { registerGameHandlers } from "./gameHandler.js";

export const connectedUsers = new Map<string, string>();

export const setupSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`⚡ Neuer Client verbunden: ${socket.id}`);

    socket.on("register", (userId: string) => {
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} registriert mit Socket ${socket.id}`);
    });

    registerRoomHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔌 Client getrennt: ${socket.id}`);

      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });
  });
};
