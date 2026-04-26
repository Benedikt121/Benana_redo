import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProfileCircle } from "../profile/profileCircle";
import { Friend } from "@/types/FriendTypes";
import { Ionicons } from "@expo/vector-icons";
import { MarqueeText } from "../common/MarqueeText";

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
    <View
      className={`flex-row items-center py-3 ${compact ? "px-2 justify-center" : "px-2"}`}
    >
      <View>
        <ProfileCircle userId={friend.friend.id} size={35} />
        <View
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${friend.isOnline ? "bg-green-500" : "bg-gray-500"} border border-[#121212]`}
          style={{
            shadowColor: friend.isOnline ? "#22c55e" : "#9ca3af",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>

      {!compact && (
        <View className="ml-3 flex-1">
          <Text
            className="text-white font-semibold text-base"
            numberOfLines={1}
          >
            {friend.friend.username}
          </Text>
          {isPlaying ? (
            <View className="flex-row items-center mt-0.5 flex-1 overflow-hidden">
              <Ionicons name="musical-notes" size={12} color="#1DB954" />
              <MarqueeText
                text={`${friend.musicState?.title || (friend.musicState as any)?.trackName} - ${friend.musicState?.artist}`}
                className="text-gray-400 text-xs ml-1"
              />
            </View>
          ) : (
            <Text className="text-gray-500 text-xs" numberOfLines={1}>
              {friend.isOnline ? "Online" : "Offline"}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
