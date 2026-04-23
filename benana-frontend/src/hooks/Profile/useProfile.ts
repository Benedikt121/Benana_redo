import { getMe, getUser } from "@/api/user.api";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";
import { useQuery } from "@tanstack/react-query";

export function useProfile(userId?: string, username?: string) {
  const { token } = useAuthStore();

  const myProfile = useUserStore((state) => state.profile);

  const isMe =
    (!userId && !username) ||
    userId === myProfile?.id ||
    username === myProfile?.username;

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.USER.ME,
    queryFn: async () => getMe(),
    enabled: !!token && isMe,
  });

  const userByIdQuery = useQuery({
    queryKey: QUERY_KEYS.USER.USER_BY_ID(userId!),
    queryFn: async () => getUser(userId, undefined),
    enabled: !!token && !!userId && !isMe,
  });

  const userByUsernameQuery = useQuery({
    queryKey: QUERY_KEYS.USER.USER_BY_NAME(username!),
    queryFn: async () => getUser(undefined, username),
    enabled: !!token && !!username && !isMe,
  });

  const displayedUser = isMe
    ? myProfile
    : userByIdQuery.data?.data || userByUsernameQuery.data?.data;

  const isAnyLoading = isMe
    ? meQuery.isLoading && !myProfile
    : userByIdQuery.isLoading || userByUsernameQuery.isLoading;

  return {
    myProfile,
    displayedUser,
    isMe,
    isLoading: isAnyLoading,
    isError: userByIdQuery.isError || userByUsernameQuery.isError,
    refetch: () => {
      userByIdQuery.refetch();
      userByUsernameQuery.refetch();
      meQuery.refetch();
    },
  };
}
