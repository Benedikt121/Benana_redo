import { ProfileCircle } from "@/components/profileCircle";
import { useProfile } from "@/hooks/Profile/useProfile";
import { useLocalSearchParams } from "expo-router";
import { Text, View, ActivityIndicator, Pressable } from "react-native";

export default function ProfileWeb() {
  const { userId, username } = useLocalSearchParams<{
    userId?: string;
    username?: string;
  }>();
  const { displayedUser, isLoading, isError, isMe } = useProfile(
    userId,
    username,
  );

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
      <Text className="text-white text-xl mt-4">{displayedUser.username}</Text>
      <Text className="text-white">
        Beigetreten am: {new Date(displayedUser.createdAt).toLocaleDateString()}
      </Text>

      <Text className="text-white text-xl mt-4">Stats</Text>
      {isMe && (
        <Pressable className="mt-3">
          <Text className="text-white">Edit Profile</Text>
        </Pressable>
      )}
    </View>
  );
}
