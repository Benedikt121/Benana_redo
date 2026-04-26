import { Text, View, Pressable, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { ProfileCircle } from "../profile/profileCircle";
import { useFriendActions } from "@/hooks/friends/useFriendActions";
import { Ionicons } from "@expo/vector-icons";
import { FriendRequest } from "@/types/FriendTypes";

export function FriendRequestToast({
  friendRequest,
}: {
  message?: string;
  description?: string;
  friendRequest: FriendRequest;
}) {
  const { acceptRequest, declineRequest, isAccepting, isDeclining } =
    useFriendActions();

  const isLoading = isAccepting || isDeclining;

  return (
    <View className="w-full px-4">
      <View className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <BlurView
          intensity={80}
          tint="dark"
          className="flex-row items-center p-4"
        >
          <ProfileCircle userId={friendRequest.sender.id} size={40} />
          <View className="ml-3 flex-1">
            <Text className="text-gray-300 text-xs" numberOfLines={1}>
              {friendRequest.sender.username} möchte dein Freund sein
            </Text>
          </View>

          <View className="flex-row gap-2 ml-2">
            <Pressable
              onPress={() => declineRequest(friendRequest.id)}
              disabled={isLoading}
              className="w-9 h-9 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20"
            >
              {isDeclining ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons name="close" size={20} color="#ef4444" />
              )}
            </Pressable>

            <Pressable
              onPress={() => acceptRequest(friendRequest.id)}
              disabled={isLoading}
              className="w-9 h-9 rounded-full bg-green-500/10 items-center justify-center border border-green-500/20"
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#22c55e" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#22c55e" />
              )}
            </Pressable>
          </View>
        </BlurView>
      </View>
    </View>
  );
}
