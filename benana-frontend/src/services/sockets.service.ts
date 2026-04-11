import { API_URL } from "@/constants/API_CONSTANTS";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = API_URL;

class SocketService {
  public socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: false,
      });
    }

    if (!this.socket.connected) {
      this.socket.connect();
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
