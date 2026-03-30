import AnimatedLiquidMetalBackground from "@/components/liquidMetalBackground";
import RainyWaterBackground from "@/components/rainyWaterBackground";
import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <>
      <RainyWaterBackground
        albumCoverUrl="https://i.scdn.co/image/ab67616d0000b27346f6a37af54494f2b038eaf0"
        palette={["#ff0055", "#0066ff", "#00ffff"]}
      />
    </>
  );
}
