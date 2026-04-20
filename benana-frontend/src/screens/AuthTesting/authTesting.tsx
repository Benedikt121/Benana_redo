import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSpotifyAuth } from "@/hooks/login/useSpotifyAuth";
import { useAppleMusicAuth } from "@/hooks/login/useAppleMusicAuth";
import { router } from "expo-router";

export default function AuthTestingMobile() {
  const { promptAsync: promptSpotify, isReady: isSpotifyReady } =
    useSpotifyAuth();
  const {
    loginWithAppleMusic,
    isAuthenticating: isAppleLoading,
    AppleAuthUI,
  } = useAppleMusicAuth();

  function handleHomeRedirect(): void {
    router.back();
  }

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-2xl font-bold mb-10 text-black">
        Mobile Auth Test
      </Text>

      <View className="w-64 my-3">
        <Pressable
          onPress={() => promptSpotify()}
          disabled={!isSpotifyReady}
          className={`bg-[#1DB954] py-4 rounded-xl items-center justify-center shadow-sm 
            ${!isSpotifyReady ? "opacity-50" : "active:opacity-80"}`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            Spotify (Mobile)
          </Text>
        </Pressable>
      </View>

      <View className="w-64 my-3">
        <Pressable
          onPress={loginWithAppleMusic}
          disabled={isAppleLoading}
          className={`bg-[#FA243C] py-4 rounded-xl items-center justify-center shadow-sm 
            ${isAppleLoading ? "opacity-50" : "active:opacity-80"}`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            {isAppleLoading ? "Lädt..." : "Apple Music (Mobile)"}
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleHomeRedirect}
        className="text-white text-3xl font-bold mb-8"
      >
        <Text className="text-white font-bold text-lg text-shadow-glow">
          Auth Test
        </Text>
      </Pressable>

      {/* WICHTIG: Das unsichtbare Modal für den Apple Login */}
      {AppleAuthUI}
    </View>
  );
}
