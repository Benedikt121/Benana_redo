import DashboardScreen from "@/screens/Home/dashboard.web";
import { Redirect } from "expo-router";
import { Platform } from "react-native";

export default function Home() {
  if (Platform.OS === "web" && window.innerWidth > 768)
    return <DashboardScreen />;
  else return <Redirect href="/(tabs)/home" />;
}
