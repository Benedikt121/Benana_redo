import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { FriendRequest } from "@/types/FriendTypes";
import { Ionicons } from "@expo/vector-icons";
import { ProfileCircle } from "../profile/profileCircle";
import { useFriendActions } from "@/hooks/friends/useFriendActions";

interface FriendRequestItemProps {
  request: FriendRequest;
}

export const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
}) => {
  const { acceptRequest, declineRequest, isAccepting, isDeclining } =
    useFriendActions();

  const isLoading = isAccepting || isDeclining;

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-white/5">
      <ProfileCircle userId={request.sender.id} size={40} />
      <View className="ml-3 flex-1">
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>
          {request.sender.username}
        </Text>
        <Text className="text-gray-500 text-xs">Möchte dein Freund sein</Text>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => declineRequest(request.id)}
          disabled={isLoading}
          className="w-8 h-8 rounded-full bg-white/5 items-center justify-center border border-white/10"
        >
          {isDeclining ? (
            <ActivityIndicator size="small" color="#888" />
          ) : (
            <Ionicons name="close" size={18} color="#888" />
          )}
        </Pressable>

        <Pressable
          onPress={() => acceptRequest(request.id)}
          disabled={isLoading}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center border border-white/20"
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
};
