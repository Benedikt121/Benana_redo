import { Stack } from "expo-router";
import "../global.css";
import { View } from "react-native";
import DeepWaterBackground from "@/components/background/deepWaterBackground";

export default function RootLayout() {
  return (
    <View className="flex-1">
      <DeepWaterBackground
        baseWaterColor="#001d5a"
        coverUrl="https://cdn-images.dzcdn.net/images/cover/05c92e1a84981eff24f275bde6b5b603/500x500.jpg"
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </View>
  );
}
