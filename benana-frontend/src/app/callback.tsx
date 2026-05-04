import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";

export default function AuthCallback() {
  useEffect(() => {
    // This is a safety call, although it's also in _layout.tsx
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  return (
    <View className="flex-1 justify-center items-center bg-black">
      <View className="items-center">
        <ActivityIndicator size="large" color="#1DB954" />
        <Text className="text-white font-bold mt-4 text-lg">
          Authentifizierung wird abgeschlossen...
        </Text>
        <Text className="text-white/50 mt-2">
          Dieses Fenster wird gleich automatisch geschlossen.
        </Text>
      </View>
    </View>
  );
}
