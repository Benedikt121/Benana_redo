import { Image } from "expo-image";
import { Pressable } from "react-native";
import { router } from "expo-router";

export default function HomeButton() {
  return (
    <Pressable onPress={() => router.push("/")}>
      <Image
        source={require("../../assets/benana_logo.svg")}
        style={{ width: 50, height: 50 }}
      />
    </Pressable>
  );
}
