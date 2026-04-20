import { useFriendsStore } from "@/store/friends.store";
import { useUserStore } from "@/store/user.store";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { API_URL } from "@/constants/API_CONSTANTS";

export interface ProfileCircleProps {
  onClick?: () => void;
  me?: boolean;
  userId?: string;
}

export function ProfileCircle({
  onClick = () => {},
  me = true,
  userId,
}: ProfileCircleProps) {
  const myUserProfilePictureUrl = useUserStore(
    (state) => state.profile?.profilePictureUrl,
  );

  const friendUserProfilePictureUrl = useFriendsStore((state) =>
    state.friends.filter((f) => f.friend.id === userId),
  );

  let profilePictureUrl: string | null | undefined;

  if (me) {
    profilePictureUrl = myUserProfilePictureUrl;
  } else {
    profilePictureUrl =
      friendUserProfilePictureUrl[0]?.friend.profilePictureUrl;
  }
  return (
    <Pressable onPress={onClick}>
      <View className="overflow-hidden rounded-full border border-gray-700">
        <Image
          source={
            profilePictureUrl &&
            profilePictureUrl !== "/public/uploads/avatar_placeholder.png"
              ? {
                  uri: profilePictureUrl.startsWith("http")
                    ? profilePictureUrl
                    : `${API_URL}${profilePictureUrl}`,
                }
              : require("../../assets/uploads/avatar_placeholder.png")
          }
          className="w-12 h-12"
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
        />
      </View>
    </Pressable>
  );
}
