import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { ActivityIndicator, View } from "react-native";
import DeepWaterBackground from "@/components/background/deepWaterBackground/deepWaterBackground";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RainyWindowBackground from "@/components/background/rainyWindowBackground/rainyWindowBackground";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";
import { useMusicSync } from "@/hooks/sockets/useMusicSync";
import { useMusicStore } from "@/store/music.store";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const queryClient = new QueryClient();

export default function RootLayout() {
  const usedBackground = useUserStore(
    (state) => state.profile?.preferedBackground,
  );

  const { token, isHydrated, hydrate } = useAuthStore();
  const hydrateMusic = useMusicStore((state) => state.hydrate);
  const segments = useSegments();
  const router = useRouter();

  useMusicSync();

  useEffect(() => {
    hydrate();
    hydrateMusic();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <View className="flex-1 bg-transparent">
          {usedBackground === "deepWater" ? (
            <DeepWaterBackground />
          ) : (
            <RainyWindowBackground />
          )}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
