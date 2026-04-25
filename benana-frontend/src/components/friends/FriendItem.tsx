import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProfileCircle } from "../profile/profileCircle";
import { Friend } from "@/types/FriendTypes";
import { Ionicons } from "@expo/vector-icons";

interface FriendItemProps {
  friend: Friend;
  compact?: boolean;
}

export const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  compact = false,
}) => {
  const isPlaying = !!friend.musicState;

  return (
    <View className={`flex-row items-center py-3 ${compact ? "px-2" : "px-4"}`}>
      <ProfileCircle userId={friend.friend.id} size={compact ? 40 : 48} />

      {!compact && (
        <View className="ml-3 flex-1">
          <Text
            className="text-white font-semibold text-base"
            numberOfLines={1}
          >
            {friend.friend.username}
          </Text>
          {isPlaying ? (
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="musical-notes" size={12} color="#1DB954" />
              <Text
                className="text-gray-400 text-xs ml-1 flex-1"
                numberOfLines={1}
              >
                {friend.musicState?.title} -{" "}
                {friend.musicState?.artist.split(",")}
              </Text>
            </View>
          ) : (
            <Text className="text-gray-500 text-xs">Offline / Idle</Text>
          )}
        </View>
      )}

      {!compact && isPlaying && (
        <View className="w-2 h-2 rounded-full bg-green-500 ml-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
      )}
    </View>
  );
};
