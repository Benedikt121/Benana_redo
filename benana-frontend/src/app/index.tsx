import AnimatedLiquidMetalBackground from "@/components/liquidMetalBackground";
import RainyWaterBackground from "@/components/rainyWaterBackground";
import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  return (
    <>
      <RainyWaterBackground
        albumCoverUrl="../../assets/endlich_Wieder_sommer.png"
        palette={["#ff0055", "#0066ff", "#00ffff"]}
      />
    </>
  );
}
