import { QUERY_KEYS } from "@/constants/QueryKeys";
import { socketService } from "@/services/sockets.service";
import { useFriendsStore } from "@/store/friends.store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "@/utils/toast";
import { FriendRequest } from "@/types/FriendTypes";

export function useFriendSocket() {
  const queryClient = useQueryClient();
  const setFriendStatus = useFriendsStore((state) => state.setFriendStatus);

  useEffect(() => {
    const socket = socketService.connect();

    const handleFriendRequestReceived = (friendRequest: FriendRequest) => {
      toast.incomingFriendRequest(friendRequest);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FRIENDS.FRIENDREQUESTS,
      });
    };

    const handleFriendRequestAccepted = (friendRequest: FriendRequest) => {
      toast.success(
        `${friendRequest.receiver?.username} hat deine Freundschaftsanfrage angenommen!`,
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FRIENDS.FRIENDLIST,
      });
    };

    const handleUserStatusChange = (data: {
      userId: string;
      isOnline: boolean;
    }) => {
      setFriendStatus(data.userId, data.isOnline);
    };

    socket.on("friendRequestReceived", handleFriendRequestReceived);
    socket.on("friendRequestAccepted", handleFriendRequestAccepted);
    socket.on("user_status_change", handleUserStatusChange);

    return () => {
      socket.off("friendRequestReceived", handleFriendRequestReceived);
      socket.off("friendRequestAccepted", handleFriendRequestAccepted);
      socket.off("user_status_change", handleUserStatusChange);
    };
  }, [queryClient, setFriendStatus]);
}
