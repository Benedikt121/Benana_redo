import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useSpotifyAuth } from "@/hooks/login/useSpotifyAuth";
import { useAppleMusicAuth } from "@/hooks/login/useAppleMusicAuth";
import { useMusicStore } from "@/store/music.store";
import { useProfile } from "@/hooks/Profile/useProfile";
import { unlinkSpotify, unlinkAppleMusic } from "@/api/user.api";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { MusicPlatform } from "@/types/MusicTypes";

export const MusicServiceManager = () => {
  const { displayedUser, isMe, refetch } = useProfile();
  const { preferedPlatform, setPreferedPlatform } = useMusicStore();
  const { promptAsync: spotifyAuth, isReady: isSpotifyReady } =
    useSpotifyAuth();
  const { loginWithAppleMusic, isAuthenticating: isAppleLoading } =
    useAppleMusicAuth();
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const queryClient = useQueryClient();

  if (!isMe || !displayedUser) return null;

  const isSpotifyLinked = (displayedUser as any).isSpotifyLinked;
  const isAppleLinked = (displayedUser as any).isAppleLinked;

  const handleUnlinkSpotify = async () => {
    try {
      setIsUnlinking("spotify");
      await unlinkSpotify();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ME });
      if (isAppleLinked) {
        setPreferedPlatform("APPLE_MUSIC");
      }
      refetch();
    } catch (error) {
      console.error("Failed to unlink Spotify:", error);
    } finally {
      setIsUnlinking(null);
    }
  };

  const handleUnlinkApple = async () => {
    try {
      setIsUnlinking("apple");
      await unlinkAppleMusic();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ME });
      if (isSpotifyLinked) {
        setPreferedPlatform("SPOTIFY");
      }
      refetch();
    } catch (error) {
      console.error("Failed to unlink Apple Music:", error);
    } finally {
      setIsUnlinking(null);
    }
  };

  const renderServiceButton = (
    name: string,
    icon: any,
    color: string,
    isLinked: boolean,
    onLink: () => void,
    onUnlink: () => void,
    isLoading: boolean,
  ) => (
    <View className="w-full mb-4 bg-white/5 p-4 rounded-2xl border border-white/10">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: color }}
          >
            {name === "Apple Music" ? (
              <Ionicons name={"logo-apple"} size={24} color="white" />
            ) : (
              <AntDesign name={"spotify"} size={24} color="black" />
            )}
          </View>
          <View>
            <Text className="text-white font-bold">{name}</Text>
            <Text className="text-white/50 text-xs">
              {isLinked ? "Verbunden" : "Nicht verbunden"}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : isLinked ? (
          <Pressable
            onPress={onUnlink}
            className="bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/50 active:opacity-70"
          >
            <Text className="text-red-400 text-xs font-medium">Entkoppeln</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onLink}
            className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 active:opacity-70"
          >
            <Text className="text-white text-xs font-medium">Verbinden</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const platforms: {
    id: MusicPlatform;
    name: string;
    icon: any;
    color: string;
    enabled: boolean;
  }[] = [
    {
      id: "SPOTIFY",
      name: "Spotify",
      icon: "logo-spotify",
      color: "#1DB954",
      enabled: isSpotifyLinked,
    },
    {
      id: "APPLE_MUSIC",
      name: "Apple Music",
      icon: "logo-apple",
      color: "#FA243C",
      enabled: isAppleLinked,
    },
  ];

  return (
    <View className="w-full">
      <Text className="text-white/70 text-xs font-bold uppercase mb-4 tracking-widest">
        Verknüpfte Dienste
      </Text>

      {renderServiceButton(
        "Spotify",
        "logo-spotify",
        "#1DB954",
        isSpotifyLinked,
        () => spotifyAuth(),
        handleUnlinkSpotify,
        isUnlinking === "spotify",
      )}

      {renderServiceButton(
        "Apple Music",
        "logo-apple",
        "#FA243C",
        isAppleLinked,
        () => loginWithAppleMusic(),
        handleUnlinkApple,
        isAppleLoading || isUnlinking === "apple",
      )}

      {(isSpotifyLinked || isAppleLinked) && (
        <View className="mt-4">
          <Text className="text-white/70 text-xs font-bold uppercase mb-4 tracking-widest">
            Bevorzugte Plattform
          </Text>
          <View className="flex-row gap-2">
            {platforms.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => p.enabled && setPreferedPlatform(p.id)}
                className={`flex-1 flex-row items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                  !p.enabled ? "opacity-30" : "opacity-100"
                } ${
                  preferedPlatform === p.id
                    ? "bg-white/20 border-white/40"
                    : "bg-white/5 border-transparent"
                }`}
              >
                {p.id === "APPLE_MUSIC" ? (
                  <Ionicons
                    name={"logo-apple"}
                    size={24}
                    color={preferedPlatform === p.id ? "#FA243C" : "grey"}
                    style={{ marginRight: 8 }}
                  />
                ) : (
                  <AntDesign
                    name={"spotify"}
                    size={24}
                    color={preferedPlatform === p.id ? "#1DB954" : "grey"}
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text
                  className={`text-white text-sm font-bold ${preferedPlatform === p.id ? "opacity-100" : "opacity-50"}`}
                >
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
