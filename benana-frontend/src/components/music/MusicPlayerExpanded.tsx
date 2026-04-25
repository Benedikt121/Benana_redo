import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useMusicControls } from "@/hooks/music/useMusicControls";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

interface MusicPlayerExpandedProps {
  visible: boolean;
  onClose: () => void;
}

export const MusicPlayerExpanded = ({
  visible,
  onClose,
}: MusicPlayerExpandedProps) => {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    skipNext,
    skipPrevious,
  } = useMusicControls();

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const albumSize = Math.min(width - 80, 340);

  if (!visible || !currentSong) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.overlay]}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={["rgba(0,0,0,0.95)", "rgba(0,0,0,0.98)", "#000"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(200)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Header — close button */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={16}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Album Art */}
        <View style={styles.albumContainer}>
          {currentSong.albumCoverUrl ? (
            <Image
              source={{ uri: currentSong.albumCoverUrl }}
              style={[
                styles.albumArt,
                { width: albumSize, height: albumSize },
              ]}
            />
          ) : (
            <View
              style={[
                styles.albumArt,
                styles.albumPlaceholder,
                { width: albumSize, height: albumSize },
              ]}
            >
              <Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.3)" />
            </View>
          )}
        </View>

        {/* Song Info */}
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {currentSong.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {currentSong.artist}
          </Text>
        </View>

        {/* Progress indicator (visual only, based on current poll data) */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: "35%" }]} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            onPress={skipPrevious}
            style={styles.sideButton}
            hitSlop={16}
          >
            <Ionicons name="play-skip-back" size={28} color="#fff" />
          </Pressable>

          <Pressable
            onPress={togglePlayPause}
            style={styles.playButton}
            hitSlop={16}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={32}
              color="#000"
            />
          </Pressable>

          <Pressable
            onPress={skipNext}
            style={styles.sideButton}
            hitSlop={16}
          >
            <Ionicons name="play-skip-forward" size={28} color="#fff" />
          </Pressable>
        </View>

        {/* Platform indicator */}
        <View style={styles.platformBadge}>
          <Ionicons
            name={
              currentSong.platform === "APPLE_MUSIC"
                ? "musical-note"
                : "logo-closed-captioning"
            }
            size={14}
            color="rgba(255,255,255,0.4)"
          />
          <Text style={styles.platformText}>
            {currentSong.platform === "APPLE_MUSIC"
              ? "Apple Music"
              : "Spotify"}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  albumContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  albumArt: {
    borderRadius: 16,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.6,
          shadowRadius: 48,
          elevation: 24,
        }),
  } as any,
  albumPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  songInfo: {
    width: "100%",
    marginTop: 32,
    gap: 4,
  },
  songTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    ...(Platform.OS === "web"
      ? { fontFamily: "Inter, system-ui, -apple-system, sans-serif" }
      : {}),
  },
  songArtist: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 16,
    ...(Platform.OS === "web"
      ? { fontFamily: "Inter, system-ui, -apple-system, sans-serif" }
      : {}),
  },
  progressContainer: {
    width: "100%",
    marginTop: 24,
    paddingHorizontal: 4,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#fff",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    marginTop: 28,
    marginBottom: 8,
  },
  sideButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  platformText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "500",
  },
});
