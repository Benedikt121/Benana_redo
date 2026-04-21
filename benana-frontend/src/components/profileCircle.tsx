import { useFriendsStore } from "@/store/friends.store";
import { useUserStore } from "@/store/user.store";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { API_URL } from "@/constants/API_CONSTANTS";
import { useProfile } from "@/hooks/Profile/useProfile";

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
  const { displayedUser } = useProfile(userId);

  const profilePictureUrl = displayedUser?.profilePictureUrl;

  const borderColor = displayedUser?.color; // hex color to border

  const imageContent = (
    <View
      style={{
        borderColor: borderColor,
      }}
      className={`overflow-hidden w-[${size}px] h-[${size}px] rounded-full border-3`}
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
