import { View, Text, Pressable } from "react-native";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "expo-router";

export default function ProfileTab() {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-white text-3xl font-bold mb-8 text-shadow-glow">
        Dein Profil
      </Text>
      <Pressable onPress={handleLogout}>
        <Text className="text-red-500 font-bold text-lg">Ausloggen</Text>
      </Pressable>
    </View>
  );
}
