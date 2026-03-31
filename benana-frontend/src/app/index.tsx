import DeepWaterBackground from "@/components/background/deepWaterBackground";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <DeepWaterBackground
        baseWaterColor="#001d5a"
        coverUrl="https://i.scdn.co/image/ab67616d0000b27346f6a37af54494f2b038eaf0"
      />
    </View>
  );
}
