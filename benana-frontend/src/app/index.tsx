import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function Index() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    router.replace("/login");
  };
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-white text-3xl font-bold mb-8">Hauptseite</Text>
      <Pressable
        onPress={handleLogout}
        className="text-white text-3xl font-bold mb-8"
      >
        <Text className="text-white font-bold text-lg">Auslogen</Text>
      </Pressable>
    </View>
  );
}
