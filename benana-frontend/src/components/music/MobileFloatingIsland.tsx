import React, { useState } from "react";
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
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { useMusicControls } from "@/hooks/music/useMusicControls";
import { useMusicStore } from "@/store/music.store";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COMPACT_WIDTH = 56;
const COMPACT_HEIGHT = 56;
const EXPANDED_WIDTH = 340;
const EXPANDED_HEIGHT = 72;

const SPRING_CONFIG = {
  damping: 22,
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

  const toggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    expansion.value = withSpring(next ? 1 : 0, SPRING_CONFIG);
  };

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
          [0.85, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const compactContentStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expansion.value < 0.3 ? 1 : 0, { duration: 100 }),
  }));

  // Only on mobile, only when there's a song
  if (Platform.OS === "web" || !hasSong || !currentSong) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[styles.wrapper, { top: insets.top + 8 }]}
    >
      <Pressable
        onPress={toggle}
        onLongPress={() => setExpandedPlayerVisible(true)}
        delayLongPress={400}
        style={{ alignItems: "center" }}
      >
        <Animated.View style={[styles.island, containerStyle]}>
          {/* Background */}
          <View style={styles.background} />

          {/* Compact View — album art thumbnail */}
          <Animated.View style={[styles.compactContent, compactContentStyle]}>
            {currentSong.albumCoverUrl ? (
              <Image
                source={{ uri: currentSong.albumCoverUrl }}
                style={styles.compactAlbumArt}
              />
            ) : (
              <View style={styles.compactAlbumPlaceholder}>
                <Ionicons name="musical-notes" size={22} color="#fff" />
              </View>
            )}
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

            {/* Song Info — tap to open expanded player */}
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
                hitSlop={12}
              >
                <Ionicons name="play-skip-back" size={16} color="#fff" />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                style={styles.playButton}
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
                style={styles.controlButton}
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

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  island: {
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 28,
  },
  // --- Compact ---
  compactContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  compactAlbumArt: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  compactAlbumPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  // --- Expanded ---
  expandedContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  expandedAlbumArt: {
    width: 48,
    height: 48,
    borderRadius: 10,
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
  },
  songArtist: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  controlButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
