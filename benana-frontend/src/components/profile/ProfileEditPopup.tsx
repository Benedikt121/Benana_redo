import { Platform, Text, View } from "react-native";
import { ImageUploader } from "./ImageUploader";

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
      <View className="flex-1 justify-start items-start pt-10 pl-10">
        <Text className="text-white text-2xl font-bold">Profilbild ändern</Text>
        <ImageUploader />
      </View>

      <View
        className={`flex-1 justify-start ${Platform.OS === "web" ? "items-end" : "items-start"} pt-10 ${
          Platform.OS === "web" ? "pr-10" : "pl-10"
        }`}
      >
        <Text className="text-white text-2xl font-bold">Farbe ändern</Text>
      </View>
    </View>
  );
}
