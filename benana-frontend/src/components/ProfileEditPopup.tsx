import { Platform, Text, View } from "react-native";

export function ProfileEditPopup({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  let width = "90vw";
  if (Platform.OS === "web") width = "50vw";
  if (!isVisible) return null;
  return (
    <View
      className={`absolute w-[${width}] h-2/3 bg-white/20 rounded-3xl border-2 border-white/10 shadow-2xl backdrop-blur-sm `}
    >
      <Text>ProfileEditPopup</Text>
    </View>
  );
}
