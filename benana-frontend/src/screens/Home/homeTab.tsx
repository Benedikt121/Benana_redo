import { useInitialData } from "@/hooks/login/useInitialData";
import { useGlobalSocket } from "@/hooks/sockets/useGlobalSocket";
import { useAuthStore } from "@/store/auth.store";
import { useMusicStore } from "@/store/music.store";
import { useMusicSync } from "@/hooks/sockets/useMusicSync";
import { useMusicColors } from "@/utils/useMusicColors";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ActivityIndicator } from "react-native";

export default function HomeTab() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-white text-3xl font-bold mb-8 text-shadow-glow">
        Hauptseite
      </Text>
    </View>
  );
}
