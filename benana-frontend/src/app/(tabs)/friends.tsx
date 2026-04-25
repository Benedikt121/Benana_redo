import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FriendList } from "@/components/friends/FriendList";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-4 pt-6">
        <Text className="text-white text-3xl font-bold mb-6 text-shadow-glow">
          Meine Freunde
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <FriendList compact={false} />
        </ScrollView>
      </View>
    </View>
  );
}
