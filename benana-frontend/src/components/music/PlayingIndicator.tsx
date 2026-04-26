import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface IndicatorBarProps {
  index: number;
  color1: string;
  color2: string;
  isPlaying: boolean;
}

const IndicatorBar = ({
  index,
  color1,
  color2,
  isPlaying,
}: IndicatorBarProps) => {
  const height = useSharedValue(6);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (!isWeb) {
      if (isPlaying) {
        const heights = [14, 19, 12, 17];
        const targetHeight = heights[index % heights.length];

        height.value = withSequence(
          withTiming(6, { duration: index * 120, easing: Easing.linear }),
          withRepeat(
            withSequence(
              withTiming(targetHeight, { duration: 400 }),
              withTiming(6, { duration: 450 }),
            ),
            -1,
            true,
          ),
        );
      } else {
        height.value = withTiming(6);
      }
    }
  }, [isPlaying, index, isWeb]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  if (isWeb) {
    // On Web, use CSS animations for perfect staggering and timing
    // We use scaleY to simulate height change from the bottom
    return (
      <View
        style={[
          styles.barBase,
          {
            backgroundColor: color1,
            height: 16,
            // @ts-ignore - web-only style
            animationDelay: isPlaying ? `${index * 0.15}s` : "0s",
            opacity: isPlaying ? 1 : 0.6,
            transform: [{ scaleY: isPlaying ? 1 : 0.4 }],
          },
        ]}
        // @ts-ignore - web-only className
        className={isPlaying ? "animate-wave" : ""}
      >
        <LinearGradient
          colors={[color1, color2]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.barBase, { backgroundColor: color1 }, animatedStyle]}
    >
      <LinearGradient
        colors={[color1, color2]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

export const PlayingIndicator = ({
  isPlaying,
  color1,
  color2,
  count = 4,
}: {
  isPlaying: boolean;
  color1: string;
  color2: string;
  count?: number;
}) => {
  return (
    <View style={styles.playingIndicator}>
      {[...Array(count)].map((_, i) => (
        <IndicatorBar
          key={i}
          index={i}
          isPlaying={isPlaying}
          color1={color1}
          color2={color2}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  playingIndicator: {
    flexDirection: "row",
    alignItems: "center", // Align to center for top-and-bottom expansion
    gap: 3,
    height: 20,
  },

  barBase: {
    width: 3.5,
    borderRadius: 2,
    overflow: "hidden",
  },
});
