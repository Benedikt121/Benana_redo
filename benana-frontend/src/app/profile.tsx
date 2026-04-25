import ProfileScreen from "@/screens/Profile/profile.web";
import { Platform } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";

export default function Profile() {
  const params = useLocalSearchParams();
  if (Platform.OS === "web") return <ProfileScreen />;
  return <Redirect href={{ pathname: "/(tabs)/profile", params }} />;
}
