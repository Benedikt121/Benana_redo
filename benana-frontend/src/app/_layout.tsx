import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { ActivityIndicator, View } from "react-native";
import DeepWaterBackground from "@/components/background/deepWaterBackground/deepWaterBackground";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RainyWindowBackground from "@/components/background/rainyWindowBackground/rainyWindowBackground";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

const queryClient = new QueryClient();

export default function RootLayout() {
  const TransparentTheme = {
    ...DefaultTheme,
    background: "transparent",
  };
  // should be switchable in the future and saved in a cookie/local storage
  const [usedBackground, setUsedBackground] = useState<
    "deepWater" | "rainyWindow"
  >("rainyWindow");

  const { token, isHydrated, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const isLoginScreen = segments[0] === "login";

    if (!token && !isLoginScreen) {
      router.replace("/login");
    } else if (token && isLoginScreen) {
      router.replace("/");
    }
  }, [token, isHydrated, segments]);

  if (!isHydrated) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
