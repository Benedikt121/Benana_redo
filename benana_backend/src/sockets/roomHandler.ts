import { Server, Socket } from "socket.io";

export const registerRoomHandlers = (io: Server, socket: Socket) => {
  socket.on("join_room", (roomId: string) => {
    socket.join(roomId);
    console.log(`🏠 Socket ${socket.id} ist Raum ${roomId} beigetreten.`);

    socket
      .to(roomId)
      .emit("room_notification", "A new player has joined the Room.");
  });

  socket.on("leave_room", (roomId: string) => {
    socket.leave(roomId);
    console.log(`👋 Socket ${socket.id} hat Raum ${roomId} verlassen.`);

    socket.to(roomId).emit("room_notification", "A player has left the Room.");
  });
};
