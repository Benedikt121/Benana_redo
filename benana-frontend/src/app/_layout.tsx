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
import { useInitialData } from "@/hooks/login/useInitialData";
import { useGlobalSocket } from "@/hooks/sockets/useGlobalSocket";
import { useMusicColors } from "@/utils/useMusicColors";
import { Toaster } from "sonner-native";
import { WebDynamicIsland } from "@/components/music/WebDynamicIsland";
import { MobileFloatingIsland } from "@/components/music/MobileFloatingIsland";
import { MusicPlayerExpanded } from "@/components/music/MusicPlayerExpanded";

export const queryClient = new QueryClient();

function AppInitializer({ children }: { children: React.ReactNode }) {
  useInitialData();
  useGlobalSocket();
  useMusicColors();
  return <>{children}</>;
}

export default function RootLayout() {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppInitializer>
          <RootLayoutContent />
        </AppInitializer>
        <Toaster
          theme="dark"
          position="top-center"
          visibleToasts={3}
          duration={3000}
          swipeToDismissDirection="left"
          richColors
          toastOptions={{
            style: {
              maxWidth: 350,
            },
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutContent() {
  const usedBackground = useUserStore(
    (state) => state.profile?.preferedBackground,
  );
  const expandedPlayerVisible = useMusicStore(
    (state) => state.expandedPlayerVisible,
  );
  const setExpandedPlayerVisible = useMusicStore(
    (state) => state.setExpandedPlayerVisible,
  );

  useMusicSync();

  return (
    <View className="flex-1 bg-transparent">
      {usedBackground === "deepWater" ? (
        <DeepWaterBackground />
      ) : (
        <RainyWindowBackground />
      )}
      <WebDynamicIsland />
      <MobileFloatingIsland />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <MusicPlayerExpanded
        visible={expandedPlayerVisible}
        onClose={() => setExpandedPlayerVisible(false)}
      />
    </View>
  );
}
