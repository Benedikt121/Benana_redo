import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Platform, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  withRepeat,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useMusicControls } from "@/hooks/music/useMusicControls";
import { useMusicStore } from "@/store/music.store";
import { useColorStore } from "@/store/color.store";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayingIndicator } from "./PlayingIndicator";
import { StatusBar } from "expo-status-bar";

const COMPACT_WIDTH = 250;
const COMPACT_HEIGHT = 42;
const EXPANDED_WIDTH = 340;

const SPRING_CONFIG = {
  stiffness: 280,
  mass: 0.9,
};

export const MobileFloatingIsland = () => {
  const {
    currentSong,
    isPlaying,
    hasSong,
    togglePlayPause,
    skipNext,
    skipPrevious,
  } = useMusicControls();

  const [isExpanded, setIsExpanded] = useState(false);
  const expansion = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const setExpandedPlayerVisible = useMusicStore(
    (s) => s.setExpandedPlayerVisible,
  );
  const dominant = useColorStore((s) => s.dominant) || "#1DB954";
  const vibrant = useColorStore((s) => s.vibrant) || "#1DB954";

  const dynamicExpandedHeight = 100;

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    expansion.value = withSpring(next ? 1 : 0, SPRING_CONFIG);
  };

  const IDLE_WIDTH = 64;
  const IDLE_HEIGHT = 42;

  const containerStyle = useAnimatedStyle(() => ({
    width: interpolate(
      expansion.value,
      [0, 1],
      [COMPACT_WIDTH, EXPANDED_WIDTH],
      Extrapolation.CLAMP,
    ),
    height: interpolate(
      expansion.value,
      [0, 1],
      [hasSong ? COMPACT_HEIGHT : IDLE_HEIGHT, dynamicExpandedHeight],
      Extrapolation.CLAMP,
    ),
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expansion.value > 0.5 ? 1 : 0, { duration: 150 }),
    paddingTop: withTiming(expansion.value > 0.5 ? insets.top * 0.4 : 0, {
      duration: 200,
    }),
    transform: [
      {
        scale: interpolate(
          expansion.value,
          [0.5, 1],
          [0.85, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const compactContentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expansion.value < 0.3 ? 1 : 0, { duration: 100 }),
  }));

  if (Platform.OS === "web") {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className="absolute left-0 right-0 z-9999 items-center top-[10px]"
      pointerEvents="box-none"
    >
      <StatusBar hidden={true} />
      <Pressable
        onPress={hasSong ? toggle : () => setExpandedPlayerVisible(true)}
        onLongPress={() => setExpandedPlayerVisible(true)}
        delayLongPress={400}
        style={{ alignItems: "center" }}
      >
        <Animated.View
          className="rounded-[28px] overflow-hidden justify-center items-center bg-black/90"
          style={[containerStyle, { backgroundColor: "rgba(0,0,0,0.9)" }]}
        >
          {/* Background */}
          <View className="absolute inset-0 border border-white/5 rounded-[28px]" />

          {/* Compact / Idle View */}
          <Animated.View
            className="absolute inset-0 flex-row items-center justify-between px-3"
            style={compactContentStyle}
          >
            {!hasSong ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="musical-notes"
                  size={20}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
            ) : (
              <>
                <View className="flex-row items-center">
                  {currentSong?.albumCoverUrl ? (
                    <Image
                      source={{ uri: currentSong.albumCoverUrl }}
                      className="w-7 h-7 rounded-lg"
                    />
                  ) : (
                    <View className="w-7 h-7 rounded-lg bg-white/10 items-center justify-center">
                      <Ionicons name="musical-notes" size={16} color="#fff" />
                    </View>
                  )}
                </View>

                <View className="flex-row items-center">
                  <PlayingIndicator
                    isPlaying={isPlaying}
                    color1={vibrant}
                    color2={dominant}
                  />
                </View>
              </>
            )}
          </Animated.View>

          {/* Expanded View — full controls */}
          <Animated.View
            className="absolute inset-0 flex-row items-center px-[14px] py-1 gap-2.5"
            style={expandedContentStyle}
          >
            {/* Album Art */}
            {currentSong?.albumCoverUrl ? (
              <Image
                source={{ uri: currentSong.albumCoverUrl }}
                className="w-12 h-12 rounded-[10px]"
              />
            ) : (
              <View className="w-12 h-12 rounded-[10px] bg-white/10 items-center justify-center">
                <Ionicons name="musical-notes" size={24} color="#fff" />
              </View>
            )}

            {/* Song Info — tap to open expanded player */}
            <Pressable
              onPress={() => setExpandedPlayerVisible(true)}
              className="flex-1 gap-[2px] overflow-hidden"
            >
              <Text
                className="text-white text-[14px] font-semibold"
                numberOfLines={1}
              >
                {currentSong?.title}
              </Text>
              <Text className="text-white/55 text-[12px]" numberOfLines={1}>
                {currentSong?.artist}
              </Text>
            </Pressable>

            {/* Controls */}
            <View className="flex-row items-center gap-[2px]">
              <Pressable
                onPress={skipPrevious}
                className="w-[34px] h-[34px] rounded-full items-center justify-center"
                hitSlop={12}
              >
                <Ionicons name="play-skip-back" size={16} color="#fff" />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                className="w-[34px] h-[34px] rounded-full bg-white items-center justify-center"
                hitSlop={12}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color="#000"
                />
              </Pressable>

              <Pressable
                onPress={skipNext}
                className="w-[34px] h-[34px] rounded-full items-center justify-center"
                hitSlop={12}
              >
                <Ionicons name="play-skip-forward" size={16} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};
