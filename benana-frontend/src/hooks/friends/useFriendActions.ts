import { useMutation } from "@tanstack/react-query";
import {
  acceptFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/api/friends.api";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { toast } from "sonner-native";
import { queryClient } from "@/app/_layout";

export function useFriendActions() {
  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      toast.success("Freundschaftsanfrage angenommen!");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FRIENDS.FRIENDLIST,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FRIENDS.FRIENDREQUESTS,
      });
    },
    onError: () => toast.error("Fehler beim Annehmen der Anfrage."),
  });

  const declineMutation = useMutation({
    mutationFn: (friendshipId: string) => removeFriend(friendshipId),
    onSuccess: () => {
      toast.info("Anfrage abgelehnt.");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FRIENDS.FRIENDREQUESTS,
      });
    },
    onError: () => toast.error("Fehler beim Ablehnen der Anfrage."),
  });

  const sendRequestMutation = useMutation({
    mutationFn: (username: string) => sendFriendRequest(username),
    onSuccess: () => {
      toast.success("Freundschaftsanfrage gesendet!");
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || "Fehler beim Senden der Anfrage.";
      toast.error(msg);
    },
  });

  return {
    acceptRequest: acceptMutation.mutate,
    declineRequest: declineMutation.mutate,
    sendRequest: sendRequestMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isDeclining: declineMutation.isPending,
    isSending: sendRequestMutation.isPending,
  };
}
