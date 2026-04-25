import React from "react";
import { View, Text, ScrollView, FlatList } from "react-native";
import { useFriendsStore } from "@/store/friends.store";
import { FriendItem } from "./FriendItem";

interface FriendListProps {
  compact?: boolean;
}

export const FriendList: React.FC<FriendListProps> = ({ compact = false }) => {
  const { friends } = useFriendsStore();

  if (friends.length === 0) {
    return (
      <View className="w-full justify-center items-center py-20 px-4">
        <Text className="text-white/50 text-center text-lg">
          {compact ? "" : "Noch keine Freunde hinzugefügt."}
        </Text>
      </View>
    );
  }

  return (
    <View className="w-full">
      {friends.map((friend) => (
        <FriendItem
          key={friend.friendshipId}
          friend={friend}
          compact={compact}
        />
      ))}
    </View>
  );
};
