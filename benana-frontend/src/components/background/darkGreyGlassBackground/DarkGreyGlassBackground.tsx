import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function DarkGreyGlassBackground() {
  return (
    <View style={styles.container}>
      {/* Solid Dark Grey Base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#121212" }]} />

      {/* Subtle Rim Highlight - Top Edge */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          backgroundColor: "rgba(255, 255, 255, 0.12)",
        }}
      />

      {/* Subtle Rim Highlight - Left Edge */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 1,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        }}
      />

      {/* Subtle Inner Glow / Depth */}
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.03)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass Surface Polish - Very subtle blur to soften the solid color */}
      <BlurView intensity={5} style={StyleSheet.absoluteFill} tint="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});
