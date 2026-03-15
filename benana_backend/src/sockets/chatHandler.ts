import { Server, Socket } from "socket.io";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on(
    "send_chat_message",
    (data: {
      roomId: string;
      username: string;
      text: string;
      color: string;
    }) => {
      const { roomId, username, text, color } = data;

      if (!text || text.trim().length === 0) return;
      if (text.length > 250) return;

      if (!socket.rooms.has(roomId)) {
        console.warn(
          `Socket ${socket.id} hat versucht, in Raum ${roomId} zu schreiben, ohne Mitglied zu sein.`,
        );
        return;
      }

      io.to(roomId).emit("receive_chat_message", {
        username,
        text: text.trim(),
        color,
        timestamp: new Date().toISOString(),
      });
    },
  );
};
