import React, { useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { FriendList } from "./FriendList";
import { Ionicons } from "@expo/vector-icons";

export const FriendListSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isExpanded ? 260 : 70, {
        velocity: 0,
        stiffness: 1000,
        damping: 100,
      }),
    };
  });

  const handleHover = (hovering: boolean) => {
    setIsExpanded(hovering);
  };

  if (Platform.OS !== "web") return null;

  return (
    <Animated.View
      onPointerEnter={() => handleHover(true)}
      onPointerLeave={() => handleHover(false)}
      style={[
        animatedStyle,
        {
          position: "absolute",
          right: 0, // Glue to the edge for better hover trigger
          top: 128,
          bottom: 32,
          zIndex: 40,
          paddingRight: 16, // Keep the 16px visual gap
        },
      ]}
    >
      <View className="flex-1 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
        <BlurView intensity={20} tint="dark" className="flex-1">
          <View className="flex-1 bg-black/20">
            <View
              className={`py-4 items-center ${isExpanded ? "px-6 items-start" : "px-0"}`}
            >
              <View className="flex-row items-center">
                <Ionicons name="people" size={20} color="white" />
                {isExpanded && (
                  <Text className="text-white font-bold ml-2 text-lg">
                    Freunde
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-1">
              <FriendList compact={!isExpanded} />
            </View>
          </View>
        </BlurView>
      </View>
    </Animated.View>
  );
};
