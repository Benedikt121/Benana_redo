import { timeStamp } from "node:console";
import { Server, Socket } from "socket.io";

export const registerChatHandlers = (io: Server, socket: Socket) => {
  socket.on(
    "send_chat_message",
    (data: {
      roomId: string;
      username: string;
      text: string;
      color: string;
      profilePictureURL: string;
    }) => {
      const { roomId, username, text, color, profilePictureURL } = data;
      io.to(roomId).emit("receive_chat_message", {
        username,
        text,
        color,
        profilePictureURL,
        timeStamp: new Date().toISOString(),
      });
    },
  );
};
