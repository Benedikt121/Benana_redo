import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

class SocketService {
  public socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("🟢 Globaler Socket verbunden:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("🔴 Globaler Socket getrennt");
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();