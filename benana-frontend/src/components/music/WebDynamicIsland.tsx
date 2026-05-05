import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Platform, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useMusicControls } from "@/hooks/music/useMusicControls";
import { useMusicStore } from "@/store/music.store";
import { useColorStore } from "@/store/color.store";
import { Ionicons } from "@expo/vector-icons";
import { PlayingIndicator } from "./PlayingIndicator";

const COMPACT_WIDTH = 120;
const COMPACT_HEIGHT = 48;
const EXPANDED_WIDTH = 420;
const EXPANDED_HEIGHT = 80;

const SPRING_CONFIG = {
  stiffness: 300,
  mass: 0.8,
};

export const WebDynamicIsland = () => {
  const {
    currentSong,
    isPlaying,
    hasSong,
    togglePlayPause,
    skipNext,
    skipPrevious,
  } = useMusicControls();

  const setExpandedPlayerVisible = useMusicStore(
    (s) => s.setExpandedPlayerVisible,
  );
  const listeningToHostId = useMusicStore((s) => s.listeningToHostId);

  const dominantColor = useColorStore((s) => s.dominant) || "#1a1a1a";
  const vibrantColor = useColorStore((s) => s.vibrant) || "#1DB954";
  const [isHovered, setIsHovered] = useState(false);
  const expansion = useSharedValue(0);

  useEffect(() => {
    expansion.value = withSpring(isHovered && hasSong ? 1 : 0, SPRING_CONFIG);
  }, [isHovered, hasSong]);

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
      [COMPACT_HEIGHT, EXPANDED_HEIGHT],
      Extrapolation.CLAMP,
    ),
  }));

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expansion.value > 0.5 ? 1 : 0, { duration: 150 }),
    transform: [
      {
        scale: interpolate(
          expansion.value,
          [0.5, 1],
          [0.8, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const compactContentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expansion.value < 0.3 ? 1 : 0, { duration: 100 }),
  }));

  if (Platform.OS !== "web") return null;

  return (
    <View
      className="absolute top-4 left-1/2 -translate-x-1/2 z-9999 items-center"
      // @ts-ignore — web-only pointer events
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <Animated.View
        className="rounded-[28px] overflow-hidden justify-center items-center"
        style={containerStyle}
      >
        {/* Background */}
        <View
          className="absolute inset-0 bg-black/90 border border-white/10 rounded-[28px]"
          style={
            {
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
            } as any
          }
        />

        {/* Compact View */}
        <Animated.View
          className="absolute inset-0 flex-row items-center justify-center gap-2 px-3"
          style={compactContentStyle}
          pointerEvents={isHovered && hasSong ? "none" : "auto"}
        >
          {!hasSong ? (
            <Pressable
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
              }}
              onPress={() => setExpandedPlayerVisible(true)}
            >
              <Ionicons
                name="musical-notes"
                size={20}
                color="rgba(255,255,255,0.8)"
              />
            </Pressable>
          ) : (
            <>
              {currentSong?.albumCoverUrl ? (
                <Image
                  source={{ uri: currentSong.albumCoverUrl }}
                  className="w-8 h-8 rounded-lg"
                />
              ) : (
                <View className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center">
                  <Ionicons name="musical-notes" size={18} color="#fff" />
                </View>
              )}

              {/* Playing indicator — now persistent for smooth animation on mount */}
              <PlayingIndicator
                isPlaying={isPlaying}
                color1={vibrantColor}
                color2={dominantColor}
              />
            </>
          )}
        </Animated.View>

        {/* Expanded View — full controls */}
        <Animated.View
          className="absolute inset-0 flex-row items-center px-4 gap-3"
          style={expandedContentStyle}
          pointerEvents={isHovered && hasSong ? "auto" : "none"}
        >
          {/* Album Art */}
          {currentSong?.albumCoverUrl ? (
            <Image
              source={{ uri: currentSong.albumCoverUrl }}
              className="w-[52px] h-[52px] rounded-xl"
            />
          ) : (
            <View className="w-[52px] h-[52px] rounded-xl bg-white/10 items-center justify-center">
              <Ionicons name="musical-notes" size={24} color="#fff" />
            </View>
          )}

          {/* Song Info — click to open expanded player */}
          <Pressable
            onPress={() => setExpandedPlayerVisible(true)}
            className="flex-1 gap-[2px] overflow-hidden"
          >
            <Text
              className="text-white text-[14px] font-semibold font-sans"
              numberOfLines={1}
            >
              {currentSong?.title}
            </Text>
            <Text
              className="text-white/55 text-[12px] font-sans"
              numberOfLines={1}
            >
              {currentSong?.artist}
            </Text>
          </Pressable>

          {/* Controls */}
          {!listeningToHostId && (
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={skipPrevious}
                className="w-9 h-9 rounded-full items-center justify-center"
                hitSlop={8}
              >
                <Ionicons name="play-skip-back" size={16} color="#fff" />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                className="w-9 h-9 rounded-full bg-white items-center justify-center"
                hitSlop={8}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={18}
                  color="#000"
                />
              </Pressable>

              <Pressable
                onPress={skipNext}
                className="w-9 h-9 rounded-full items-center justify-center"
                hitSlop={8}
              >
                <Ionicons name="play-skip-forward" size={16} color="#fff" />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
};
