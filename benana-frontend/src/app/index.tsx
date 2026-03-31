import DeepWaterBackground from "@/components/background/deepWaterBackground";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {/* Wenn backgroundColor 'black' sichtbar wird, weißt du, dass der Shader abstürzt. 
      Bleibt es weiß, hat deine View keine Größe! */}
      <DeepWaterBackground albumColor="#ff0000" />
    </View>
  );
}
