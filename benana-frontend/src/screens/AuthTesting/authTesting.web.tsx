import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSpotifyAuth } from "@/hooks/login/useSpotifyAuth";
import { useAppleMusicAuth } from "@/hooks/login/useAppleMusicAuth";

export default function AuthTestingWeb() {
  const { promptAsync: promptSpotify, isReady: isSpotifyReady } =
    useSpotifyAuth();
  const { loginWithAppleMusic, isAuthenticating: isAppleLoading } =
    useAppleMusicAuth();

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-10 text-black">Web Auth Test</Text>

      <View className="w-64 my-3">
        <Pressable
          onPress={() => promptSpotify()}
          disabled={!isSpotifyReady}
          className={`bg-[#1DB954] py-4 rounded-xl items-center justify-center shadow-sm 
            ${!isSpotifyReady ? "opacity-50 hover:cursor-not-allowed" : "hover:opacity-90 active:opacity-80"}`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            Spotify (Web)
          </Text>
        </Pressable>
      </View>

      <View className="w-64 my-3">
        <Pressable
          onPress={loginWithAppleMusic}
          disabled={isAppleLoading}
          className={`bg-[#FA243C] py-4 rounded-xl items-center justify-center shadow-sm 
            ${isAppleLoading ? "opacity-50 hover:cursor-not-allowed" : "hover:opacity-90 active:opacity-80"}`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            {isAppleLoading ? "Lädt..." : "Apple Music (Web)"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
