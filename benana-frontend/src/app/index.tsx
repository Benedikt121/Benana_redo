import { useInitialData } from "@/hooks/login/useInitialData";
import { useGlobalSocket } from "@/hooks/sockets/useGlobalSocket";
import { useAuthStore } from "@/store/auth.store";
import { useMusicColors } from "@/utils/useMusicColors";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ActivityIndicator } from "react-native";

export default function Index() {
  const { isLoading } = useInitialData();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };
  const handleAuthTestingRedirect = () => router.navigate("/authTesting");
  useGlobalSocket();
  useMusicColors();
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-white text-3xl font-bold mb-8 text-shadow-glow">
        Hauptseite
      </Text>
      <Pressable
        onPress={handleLogout}
        className="text-white text-3xl font-bold mb-8"
      >
        <Text className="text-white font-bold text-lg text-shadow-glow">
          Auslogen
        </Text>
      </Pressable>

      <Pressable
        onPress={handleAuthTestingRedirect}
        className="text-white text-3xl font-bold mb-8"
      >
        <Text className="text-white font-bold text-lg text-shadow-glow">
          Zum Auth-Test
        </Text>
      </Pressable>
    </View>
  );
}
