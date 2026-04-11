import { socketService } from "@/services/sockets.service";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";

export function useGlobalSocket() {
  const userId = useUserStore((state) => state.profile?.id);

  useEffect(() => {
    if (!userId) return;

    const socket = socketService.connect();

    socket.emit("register", userId);

    const handleReconnect = () => {
      console.log("🔄 Socket neu verbunden, registriere User erneut...");
      socket.emit("register", userId);
    };

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
      socketService.disconnect();
    };
  }, [userId]);
}
