import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FriendList } from "@/components/friends/FriendList";
import { BlurView } from "expo-blur";

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <View className="flex-1 px-4 pt-4 pb-4">
        <View className="flex-1 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <BlurView intensity={45} tint="dark" className="flex-1">
            <View className="flex-1 bg-black/30 px-4 pt-6">
              <Text className="text-white text-3xl font-bold mb-6 text-shadow-glow">
                Meine Freunde
              </Text>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
              >
                <FriendList compact={false} />
              </ScrollView>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}
