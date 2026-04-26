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
  className?: string;
}

export function ProfileCircle({
  onClick,
  me = true,
  userId,
  size = 48,
  className,
}: ProfileCircleProps) {
  const { displayedUser } = useProfile(userId);

  const profilePictureUrl = displayedUser?.profilePictureUrl;
  const borderColor = displayedUser?.color || "#ffffff";

  const getSource = () => {
    if (
      !profilePictureUrl ||
      profilePictureUrl === "/public/uploads/avatar_placeholder.png"
    ) {
      return require("../../../assets/uploads/avatar_placeholder.png");
    }

    if (profilePictureUrl.startsWith("http")) {
      return { uri: profilePictureUrl };
    }

    return {
      uri: `${API_URL}${profilePictureUrl.startsWith("/") ? "" : "/"}${profilePictureUrl}`,
    };
  };

  const imageContent = (
    <View
      style={{
        borderColor: borderColor,
        width: size,
        height: size,
      }}
      className="overflow-hidden rounded-full border-2"
    >
      <Image
        source={getSource()}
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={200}
        cachePolicy="disk"
      />
    </View>
  );

  if (onClick) {
    return (
      <Pressable onPress={onClick} className={className}>
        {imageContent}
      </Pressable>
    );
  }

  return imageContent;
}
