import { ProfileCircle } from "@/components/profile/profileCircle";
import { ProfileEditPopup } from "@/components/profile/ProfileEditPopup";
import { useProfile } from "@/hooks/Profile/useProfile";
import { useAuthStore } from "@/store/auth.store";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View, ActivityIndicator, Pressable } from "react-native";

export default function ProfileWeb() {
  const [isEditPopupVisible, setIsEditPopupVisible] = useState(false);
  const { userId, username } = useLocalSearchParams<{
    userId?: string;
    username?: string;
  }>();
  const { displayedUser, isLoading, isError, isMe } = useProfile(
    userId,
    username,
  );

  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  if (isError || !displayedUser) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-white">Error loading profile</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center">
      <ProfileCircle size={150} userId={displayedUser.id} me={isMe} />
      {isMe && (
        <Pressable
          className="mt-0.5"
          onPress={() => setIsEditPopupVisible(true)}
        >
          <Text className="text-white text-xs underline">
            Profilbild/Farbe ändern
          </Text>
        </Pressable>
      )}
      <Text className="text-white text-xl mt-4">{displayedUser.username}</Text>
      <Text className="text-white">
        Beigetreten am: {new Date(displayedUser.createdAt).toLocaleDateString()}
      </Text>

      <Text className="text-white text-xl mt-4">Stats</Text>
      {isMe && (
        <Pressable className="mt-3" onPress={handleLogout}>
          <Text className="text-white">Logout</Text>
        </Pressable>
      )}

      <ProfileEditPopup
        isVisible={isEditPopupVisible}
        onClose={() => setIsEditPopupVisible(false)}
      />
    </View>
  );
}
