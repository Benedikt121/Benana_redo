import { useFriendsStore } from "@/store/friends.store";
import { useUserStore } from "@/store/user.store";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { API_URL } from "@/constants/API_CONSTANTS";

export interface ProfileCircleProps {
  onClick?: () => void;
  me?: boolean;
  userId?: string;
  size?: number;
}

export function ProfileCircle({
  onClick,
  me = true,
  userId,
  size = 48,
}: ProfileCircleProps) {
  const myUserProfilePictureUrl = useUserStore(
    (state) => state.profile?.profilePictureUrl,
  );

  const friendProfilePictureUrl = useFriendsStore(
    (state) =>
      state.friends.find((f) => f.friend.id === userId)?.friend
        .profilePictureUrl,
  );

  let profilePictureUrl: string | null | undefined;

  if (me) {
    profilePictureUrl = myUserProfilePictureUrl;
  } else {
    profilePictureUrl = friendProfilePictureUrl;
  }
  const imageContent = (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="overflow-hidden border border-gray-700"
    >
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
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />
    </View>
  );

  if (onClick) {
    return <Pressable onPress={onClick}>{imageContent}</Pressable>;
  }

  return imageContent;
}
