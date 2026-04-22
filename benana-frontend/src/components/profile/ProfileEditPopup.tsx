import { Platform, Text, View } from "react-native";
import { ImageUploader } from "./ImageUploader";
import { ColorChanger } from "./ColorChanger";

export function ProfileEditPopup({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  if (!isVisible) return null;
  return (
    <View
      className={`absolute ${
        Platform.OS === "web" ? "w-1/2" : "w-[90%]"
      } h-2/3 bg-white/20 rounded-3xl border-2 border-white/10 shadow-2xl backdrop-blur-sm flex ${Platform.OS === "web" ? "flex-row" : "flex-col"}`}
    >
      <View className="flex-1 justify-start items-center pt-10 px-10">
        <Text className="text-white text-2xl font-bold self-start mb-4">
          Profilbild ändern
        </Text>
        <ImageUploader />
      </View>

      <View className={`flex-1 justify-start items-center pt-10`}>
        <Text
          className={`text-white text-2xl font-bold ${
            Platform.OS === "web" ? "self-center" : "self-start"
          }`}
        >
          Farbe ändern
        </Text>
        <ColorChanger />
      </View>

      <View className="flex-1 justify-start items-center pt-10 px-10">
        <Text
          className={`text-white text-2xl font-bold mb-4 ${
            Platform.OS === "web" ? "self-start" : "self-end"
          }`}
        >
          Hintergrund ändern
        </Text>
      </View>
    </View>
  );
}
