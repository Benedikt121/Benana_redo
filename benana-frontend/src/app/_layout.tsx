import { Stack } from "expo-router";
import "../global.css";
import { View } from "react-native";
import DeepWaterBackground from "@/components/background/deepWaterBackground/deepWaterBackground";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";

export default function RootLayout() {
  const TransparentTheme = {
    ...DefaultTheme,
    background: "transparent",
  };
  return (
    <ThemeProvider value={TransparentTheme}>
      <View className="flex-1 bg-transparent">
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
    </ThemeProvider>
  );
}
