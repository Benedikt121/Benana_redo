import { Server, Socket } from "socket.io";

export const connectedUsers = new Map<string, string>();

export const setupSockets = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`⚡ Neuer Client verbunden: ${socket.id}`);

    socket.on("register", (userId: string) => {
      connectedUsers.set(userId, socket.id);
      console.log(`👤 User ${userId} registriert mit Socket ${socket.id}`);
    });

    socket.on("join_room", (roomId: string) => {
      socket.join(roomId);
      console.log(`🏠 Socket ${socket.id} lauscht nun auf Raum: ${roomId}`);
    });

    socket.on("leave_room", (roomId: string) => {
      socket.leave(roomId);
    });

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
