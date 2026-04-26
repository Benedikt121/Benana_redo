import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { Platform } from "react-native";
import { Buffer } from "buffer";
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
import { useAppleMusicLocalSync } from "@/hooks/music/useAppleMusicLocalSync";

export const queryClient = new QueryClient();

// Compatibility polyfill for MusicKit JS v3 in Metro/Expo web environment
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.process) win.process = {};
  win.process.browser = true;
  win.process.env = win.process.env || {};
  win.process.versions = win.process.versions || {};
  // Explicitly delete node property to avoid tricking libraries
  if (win.process.versions.node) delete win.process.versions.node;
  
  if (!win.Buffer) {
    win.Buffer = Buffer;
  }
}

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
  useAppleMusicLocalSync();

  useEffect(() => {
    if (Platform.OS === "web") {
      // Use a specific, stable version instead of the 'prerelease' latest
      const scriptUrl = "https://js-cdn.music.apple.com/musickit/v3/musickit.js"; 
      // Note: We'll stick to the main URL but ensure we clear the cache if possible
      if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, []);

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
