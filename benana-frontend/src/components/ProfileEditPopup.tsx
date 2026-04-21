import { Text, View } from "react-native";

export function ProfileEditPopup({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  if (!isVisible) return null;
  return (
    <View className="absolute bottom-0 left-0 right-0 h-2/3 bg-background rounded-t-3xl border-t-2 border-white/10">
      <Text>ProfileEditPopup</Text>
    </View>
  );
}
