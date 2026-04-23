import { Redirect, useLocalSearchParams } from "expo-router";

export default function Profile() {
  const params = useLocalSearchParams();
  return <Redirect href={{ pathname: "/(tabs)/profile", params }} />;
}
