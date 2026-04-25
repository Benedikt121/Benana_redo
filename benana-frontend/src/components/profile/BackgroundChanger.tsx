import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useUserStore } from "@/store/user.store";
import { Backgrounds } from "@/types/UserTypes";
import { toast } from "@/utils/toast";

export function BackgroundChanger() {
  const { profile, setPreferedBackgound } = useUserStore();

  const backgrounds: { id: Backgrounds; name: string }[] = [
    { id: "deepWater", name: "Deep Water" },
    { id: "rainyWindow", name: "Rainy Window" },
  ];

  return (
    <View className="mt-6 w-full px-6">
      <Text className="text-white/50 text-sm mb-4">
        Wähle deinen Hintergrund
      </Text>
      <View className="gap-4">
        {backgrounds.map((bg) => (
          <Pressable
            key={bg.id}
            onPress={async () => {
              setPreferedBackgound(bg.id);
              toast.success("Hintergrund erfolgreich geändert!", `${bg.name}`);
            }}
            className={`p-4 rounded-2xl border-2 transition-all ${
              profile?.preferedBackground === bg.id
                ? "border-white bg-white/20"
                : "border-white/10 bg-white/5"
            }`}
          >
            <Text
              className={`text-lg font-semibold ${
                profile?.preferedBackground === bg.id
                  ? "text-white"
                  : "text-white/60"
              }`}
            >
              {bg.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
