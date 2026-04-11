import { Stack, useRouter, useSegments } from "expo-router";
import "../global.css";
import { ActivityIndicator, View } from "react-native";
import DeepWaterBackground from "@/components/background/deepWaterBackground/deepWaterBackground";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RainyWindowBackground from "@/components/background/rainyWindowBackground/rainyWindowBackground";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useMusicColors } from "@/utils/useMusicColors";
import { useMusicSync } from "@/hooks/sockets/useMusicSync";
import { useUserStore } from "@/store/user.store";
import { useGlobalSocket } from "@/hooks/sockets/useGlobalSocket";

const queryClient = new QueryClient();

export default function RootLayout() {
  // should be switchable in the future and saved in a cookie/local storage
  const usedBackground = useUserStore(
    (state) => state.profile?.preferedBackground,
  );

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

  useMusicColors();
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
