import { Stack } from "expo-router";
import "../global.css";
import { View } from "react-native";
import DeepWaterBackground from "@/components/background/deepWaterBackground/deepWaterBackground";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import RainyWindowBackground from "@/components/background/rainyWindowBackground/rainyWindowBackground";
import { useState } from "react";

export default function RootLayout() {
  const TransparentTheme = {
    ...DefaultTheme,
    background: "transparent",
  };
  const [usedBackground, setUsedBackground] = useState<
    "deepWater" | "rainyWindow"
  >("rainyWindow");
  return (
    <ThemeProvider value={TransparentTheme}>
      <View className="flex-1 bg-transparent">
        {usedBackground === "deepWater" ? (
          <DeepWaterBackground coverUrl="https://i.scdn.co/image/ab67616d0000b27346f6a37af54494f2b038eaf0" />
        ) : (
          <RainyWindowBackground coverUrl="https://i.scdn.co/image/ab67616d0000b27346f6a37af54494f2b038eaf0" />
        )}
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
