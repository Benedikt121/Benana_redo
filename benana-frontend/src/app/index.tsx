import DeepWaterBackground from "@/components/background/deepWaterBackground";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <DeepWaterBackground
        albumColor="#000000"
        coverUrl="https://i.scdn.co/image/ab67616d0000b27346f6a37af54494f2b038eaf0"
        dropSize={30}
        dropIntensity={0.7}
        dropInterval={0.02}
        damping={0.995}
        attenuation={0.002}
      />
    </View>
  );
}
