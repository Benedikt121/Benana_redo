import DeepWaterBackground from "@/components/background/deepWaterBackground";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <DeepWaterBackground
        baseWaterColor="#001d5a"
        coverUrl="https://cdn-images.dzcdn.net/images/cover/05c92e1a84981eff24f275bde6b5b603/500x500.jpg"
      />
    </View>
  );
}
