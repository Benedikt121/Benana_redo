import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Image,
  StyleSheet,
} from "react-native";
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

  const dominantColor = useColorStore((s) => s.dominant) || "#1a1a1a";
  const vibrantColor = useColorStore((s) => s.vibrant) || "#1DB954";
  const [isHovered, setIsHovered] = useState(false);
  const expansion = useSharedValue(0);

  useEffect(() => {
    expansion.value = withSpring(isHovered ? 1 : 0, SPRING_CONFIG);
  }, [isHovered]);

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

  if (Platform.OS !== "web" || !hasSong || !currentSong) return null;

  return (
    <View
      style={styles.wrapper}
      // @ts-ignore — web-only pointer events
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      <Animated.View style={[styles.island, containerStyle]}>
        {/* Background */}
        <View style={styles.background} />

        {/* Compact View — album art only */}
        <Animated.View style={[styles.compactContent, compactContentStyle]}>
          {currentSong.albumCoverUrl ? (
            <Image
              source={{ uri: currentSong.albumCoverUrl }}
              style={styles.compactAlbumArt}
            />
          ) : (
            <View style={styles.compactAlbumPlaceholder}>
              <Ionicons name="musical-notes" size={18} color="#fff" />
            </View>
          )}

          {/* Playing indicator — now persistent for smooth animation on mount */}
          <PlayingIndicator
            isPlaying={isPlaying}
            color1={vibrantColor}
            color2={dominantColor}
          />
        </Animated.View>

        {/* Expanded View — full controls */}
        <Animated.View style={[styles.expandedContent, expandedContentStyle]}>
          {/* Album Art */}
          {currentSong.albumCoverUrl ? (
            <Image
              source={{ uri: currentSong.albumCoverUrl }}
              style={styles.expandedAlbumArt}
            />
          ) : (
            <View style={[styles.expandedAlbumArt, styles.albumPlaceholder]}>
              <Ionicons name="musical-notes" size={24} color="#fff" />
            </View>
          )}

          {/* Song Info — click to open expanded player */}
          <Pressable
            onPress={() => setExpandedPlayerVisible(true)}
            style={styles.songInfo}
          >
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </Pressable>

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              onPress={skipPrevious}
              style={styles.controlButton}
              hitSlop={8}
            >
              <Ionicons name="play-skip-back" size={16} color="#fff" />
            </Pressable>

            <Pressable
              onPress={togglePlayPause}
              style={styles.playButton}
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
              style={styles.controlButton}
              hitSlop={8}
            >
              <Ionicons name="play-skip-forward" size={16} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute" as any,
    top: 16,
    left: "50%" as any,
    transform: [{ translateX: "-50%" as any }],
    zIndex: 9999,
    alignItems: "center",
  },
  island: {
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.88)",
    // @ts-ignore — web-only
    backdropFilter: "blur(20px)",
    // @ts-ignore — web-only
    WebkitBackdropFilter: "blur(20px)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 28,
    // @ts-ignore — web-only
    boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
  },
  // --- Compact ---
  compactContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  compactAlbumArt: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  compactAlbumPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Expanded ---
  expandedContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  expandedAlbumArt: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  albumPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    flex: 1,
    gap: 2,
    overflow: "hidden",
  },
  songTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  songArtist: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
