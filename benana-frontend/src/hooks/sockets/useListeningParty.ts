import { socketService } from "@/services/sockets.service";
import { useMusicStore } from "@/store/music.store";

export function useListeningParty() {
  const setListeningToHostId = useMusicStore(
    (state) => state.setListeningToHostId,
  );

  const joinParty = (hostUserId: string) => {
    const socket = socketService.socket;
    if (socket) {
      socket.emit("JOIN_LISTENING_PARTY", hostUserId);
      setListeningToHostId(hostUserId);
      console.log(`🎵 Party von User ${hostUserId} beigetreten`);
    }
  };

  const leaveParty = (hostUserId: string) => {
    const socket = socketService.socket;
    if (socket) {
      socket.emit("LEAVE_LISTENING_PARTY", hostUserId);
      setListeningToHostId(null);
      // Optional: Lade hier sofort wieder DEINEN eigenen Spotify-Status,
      // falls du eigene Musik im Hintergrund hattest.
      console.log(`🚪 Party von User ${hostUserId} verlassen`);
    }
  };

  return { joinParty, leaveParty };
}
