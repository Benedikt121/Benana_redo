import { updateColor } from "@/api/user.api";
import { useUserStore } from "@/store/user.store";
import { useState } from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import ColorPicker, {
  HueSlider,
  InputWidget,
  Panel1,
  Preview,
} from "reanimated-color-picker";

export function ColorChanger() {
  const { profile } = useUserStore();
  const [color, setColor] = useState<string | undefined>(profile?.color);

  const setProfile = useUserStore((state) => state.setProfile);

  const handleColorChange = ({ hex }: { hex: string }) => {
    setColor(hex);
  };

  return (
    <View className="mt-6 items-center w-full px-6">
      <ColorPicker
        style={{ width: "100%", gap: 15 }}
        value={profile?.color}
        onComplete={handleColorChange}
      >
        <Preview style={styles.preview} />
        <Panel1 style={styles.panel} />
        <HueSlider style={styles.slider} />
        <InputWidget
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
          inputTitleStyle={styles.inputTitle}
          iconColor="#ffffff"
          iconStyle={styles.icon}
        />
      </ColorPicker>

      {color !== profile?.color && (
        <Pressable
          className="bg-white/20 px-6 py-2 rounded-xl items-center justify-center mt-4"
          onPress={async () => {
            if (profile && color) {
              await updateColor(color);
              setProfile({ ...profile, color: color });
            }
          }}
        >
          <Text className="text-white text-lg font-bold">Farbe bestätigen</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 40,
    borderRadius: 12,
  },
  panel: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  slider: {
    borderRadius: 10,
    height: 20,
    marginTop: 5,
  },
  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    color: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  inputTitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  icon: {
    width: 22,
    height: 22,
  },
});
