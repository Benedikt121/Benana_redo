import { getFriendRequests, getFriends } from "@/api/friends.api";
import { getInvites } from "@/api/invites.api";
import { getMe } from "@/api/user.api";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { useAuthStore } from "@/store/auth.store";
import { useFriendsStore } from "@/store/friends.store";
import { useMusicStore } from "@/store/music.store";
import { useInvitesStore } from "@/store/room.store";
import { useUserStore } from "@/store/user.store";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useInitialData() {
  const { token } = useAuthStore();
  const setProfile = useUserStore((state) => state.setProfile);
  const setPreferedPlatform = useMusicStore(
    (state) => state.setPreferedPlatform,
  );
  const setFriends = useFriendsStore((state) => state.setFriends);
  const setFriendRequests = useFriendsStore((state) => state.setFriendRequests);
  const setRoomInvites = useInvitesStore((state) => state.setRoomInvites);

  const userQuery = useQuery({
    queryKey: QUERY_KEYS.USER.ME,
    queryFn: async () => getMe(),
    enabled: !!token,
  });

  const friendsQuery = useQuery({
    queryKey: QUERY_KEYS.FRIENDS.FRIENDLIST,
    queryFn: async () => getFriends(),
    enabled: !!token,
  });

  const friendRequestsQuery = useQuery({
    queryKey: QUERY_KEYS.FRIENDS.FRIENDREQUESTS,
    queryFn: async () => getFriendRequests(),
    enabled: !!token,
  });

  const roomInvitesQuery = useQuery({
    queryKey: QUERY_KEYS.INVITES.ROOM_INVITES,
    queryFn: async () => getInvites(),
    enabled: !!token,
  });

  useEffect(() => {
    if (userQuery.data) {
      setProfile(userQuery.data.data);
      if (userQuery.data.data.isAppleLinked) {
        setPreferedPlatform("APPLE_MUSIC");
      } else if (userQuery.data.data.isSpotifyLinked) {
        setPreferedPlatform("SPOTIFY");
      }
    }
    if (friendsQuery.data) setFriends(friendsQuery.data.data);
    if (friendRequestsQuery.data)
      setFriendRequests(friendRequestsQuery.data.data);
    if (roomInvitesQuery.data) setRoomInvites(roomInvitesQuery.data.data);
  }, [
    userQuery.data,
    friendsQuery.data,
    friendRequestsQuery.data,
    roomInvitesQuery.data,
  ]);

  return {
    isLoading:
      userQuery.isLoading ||
      friendsQuery.isLoading ||
      friendRequestsQuery.isLoading ||
      roomInvitesQuery.isLoading,
    isError:
      userQuery.isError ||
      friendsQuery.isError ||
      friendRequestsQuery.isError ||
      roomInvitesQuery.isError,
    refetch: () => {
      userQuery.refetch();
      friendsQuery.refetch();
      friendRequestsQuery.refetch();
      roomInvitesQuery.refetch();
    },
  };
}
