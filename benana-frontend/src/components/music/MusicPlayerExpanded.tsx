import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  useWindowDimensions,
  Platform,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useMusicControls } from "@/hooks/music/useMusicControls";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { PlayingIndicator } from "./PlayingIndicator";
import { useColorStore } from "@/store/color.store";
import { ScrollView, ActivityIndicator } from "react-native";
import { musicPlayback } from "@/services/musicPlayback.service";
import { useUserStore } from "@/store/user.store";
import type { IPlaylist } from "@lomray/react-native-apple-music";
import { useMusicProgress } from "@/hooks/music/useMusicProgress";
import { formatTimeMs } from "@/utils/formatTimeMs";
import { useQuery } from "@tanstack/react-query";
import { useMusicStore } from "@/store/music.store";

interface MusicPlayerExpandedProps {
  visible: boolean;
  onClose: () => void;
}

export const MusicPlayerExpanded = ({
  visible,
  onClose,
}: MusicPlayerExpandedProps) => {
  const { currentSong, isPlaying, togglePlayPause, skipNext, skipPrevious } =
    useMusicControls();
  const currentProgress = useMusicProgress();

  const progressPercent = currentSong?.length
    ? Math.min(100, Math.max(0, (currentProgress / currentSong.length) * 100))
    : 0;

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${progressPercent}%`, {
        duration: isPlaying ? 500 : 200,
        easing: Easing.linear,
      }),
    };
  }, [progressPercent, isPlaying]);

  const dominant = useColorStore((s) => s.dominant) || "#1DB954";
  const vibrant = useColorStore((s) => s.vibrant) || "#1DB954";

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const appleMusicToken = useUserStore((s) => s.profile?.appleMusicUserToken);

  const { shuffle, repeatMode, autoplay } = useMusicStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);

  const preferedPlatform = useMusicStore((s) => s.preferedPlatform);

  React.useEffect(() => {
    if (visible) {
      setSelectedPlaylist(null);
      loadPlaylists();
    }
  }, [visible, preferedPlatform]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await musicPlayback.fetchPlaylists();
      setPlaylists(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const { data: playlistTracks, isLoading: isLoadingTracks } = useQuery({
    queryKey: ["playlist-tracks", selectedPlaylist?.id],
    queryFn: () => musicPlayback.fetchPlaylistTracks(selectedPlaylist!.id),
    enabled: !!selectedPlaylist,
  });

  const playPlaylist = async (id: string) => {
    await musicPlayback.playPlaylist(id);
    onClose();
  };

  const playTrack = async (trackId: string) => {
    await musicPlayback.playTrack(trackId);
    onClose();
  };

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Responsive album size: larger on web/desktop
  const isLargeScreen = width > 768;
  const albumSize = isLargeScreen
    ? Math.min(width * 0.45, 480)
    : Math.min(width - 80, 340);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0,0,0,0.95)",
      }}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={["rgba(0,0,0,0.95)", "rgba(0,0,0,0.98)", "#000"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Animated.View
        entering={SlideInDown.springify()
          .stiffness(200)
          .duration(200)
          .easing(Easing.inOut(Easing.ease))}
        exiting={SlideOutDown.duration(200)}
        className="flex-1 justify-between items-center px-8"
        style={[
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ paddingBottom: 40, alignItems: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header — close button */}
          <View className="w-full flex-row items-center justify-between mb-6">
            <Pressable
              onPress={onClose}
              className="w-7 h-7 items-center justify-center"
              hitSlop={16}
            >
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </Pressable>
            <Text className="text-white/50 text-[13px] font-semibold uppercase tracking-[1.5px]">
              Now Playing
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {currentSong && (
            <>
              {/* Album Art */}
              <View className="flex-1 justify-center items-center">
                {currentSong.albumCoverUrl ? (
                  <Image
                    source={{ uri: currentSong.albumCoverUrl }}
                    className="rounded-2xl"
                    style={[{ width: albumSize, height: albumSize }]}
                  />
                ) : (
                  <View
                    className="rounded-2xl overflow-hidden border border-white/10"
                    style={{ width: albumSize, height: albumSize }}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.1)",
                        "rgba(255,255,255,0.02)",
                      ]}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="musical-notes"
                        size={64}
                        color="rgba(255,255,255,0.3)"
                      />
                    </LinearGradient>
                  </View>
                )}
              </View>

              {/* Song Info */}
              <View className="w-full md:max-w-[500px] mt-8 gap-1">
                <View className="flex-row items-center justify-between gap-3">
                  <Text
                    className="text-white text-[22px] md:text-[26px] font-bold flex-1 web:font-sans"
                    numberOfLines={1}
                  >
                    {currentSong.title}
                  </Text>
                  <PlayingIndicator
                    isPlaying={isPlaying}
                    color1={vibrant}
                    color2={dominant}
                  />
                </View>
                <Text
                  className="text-white/55 text-base md:text-lg web:font-sans"
                  numberOfLines={1}
                >
                  {currentSong.artist}
                </Text>
              </View>

              {/* Progress indicator */}
              <View className="w-full md:max-w-[500px] mt-6 px-1">
                <View className="w-full h-1 rounded-sm bg-white/10 overflow-hidden">
                  <Animated.View
                    className="h-full rounded-sm bg-white"
                    style={[animatedProgressStyle]}
                  />
                </View>
                <View className="flex-row justify-between mt-2">
                  <Text className="text-white/50 text-xs font-medium">
                    {formatTimeMs(currentProgress)}
                  </Text>
                  <Text className="text-white/50 text-xs font-medium">
                    {formatTimeMs(currentSong.length)}
                  </Text>
                </View>
              </View>

              {/* Controls */}
              <View className="flex-row items-center justify-center gap-10 md:gap-8 mt-7 mb-2">
                <Pressable
                  onPress={skipPrevious}
                  className="w-12 h-12 md:w-10 md:h-10 rounded-full items-center justify-center"
                  hitSlop={16}
                >
                  <Ionicons
                    name="play-skip-back"
                    size={isLargeScreen ? 24 : 28}
                    color="#fff"
                  />
                </Pressable>

                <Pressable
                  onPress={togglePlayPause}
                  className="w-16 h-16 md:w-14 md:h-14 rounded-full bg-white items-center justify-center"
                  hitSlop={16}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={isLargeScreen ? 28 : 32}
                    color="#000"
                  />
                </Pressable>

                <Pressable
                  onPress={skipNext}
                  className="w-12 h-12 md:w-10 md:h-10 rounded-full items-center justify-center"
                  hitSlop={16}
                >
                  <Ionicons
                    name="play-skip-forward"
                    size={isLargeScreen ? 24 : 28}
                    color="#fff"
                  />
                </Pressable>
              </View>

              {/* Platform indicator & Playback Modes */}
              <View className="w-full md:max-w-[500px] flex-row items-center justify-between mt-4 py-2 border-t border-white/5">
                <View className="flex-row items-center gap-1">
                  {currentSong.platform === "APPLE_MUSIC" ? (
                    <Ionicons
                      name={"logo-apple"}
                      size={14}
                      color={"#FA243C"}
                      style={{ marginRight: 4 }}
                    />
                  ) : (
                    <AntDesign
                      name={"spotify"}
                      size={14}
                      color={"#1DB954"}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                    {currentSong.platform === "APPLE_MUSIC"
                      ? "Apple Music"
                      : "Spotify"}
                  </Text>
                </View>

                <View className="flex-row items-center gap-6">
                  <>
                    <Pressable
                        onPress={() => musicPlayback.setShuffle(!shuffle)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="shuffle"
                          size={20}
                          color={shuffle ? vibrant : "rgba(255,255,255,0.3)"}
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          const modes: ("off" | "one" | "all")[] = [
                            "off",
                            "one",
                            "all",
                          ];
                          const next =
                            modes[(modes.indexOf(repeatMode) + 1) % 3];
                          musicPlayback.setRepeatMode(next);
                        }}
                        hitSlop={8}
                      >
                        <View className="items-center justify-center">
                          <Ionicons
                            name={
                              repeatMode === "one" ? "repeat-outline" : "repeat"
                            }
                            size={20}
                            color={
                              repeatMode !== "off"
                                ? vibrant
                                : "rgba(255,255,255,0.3)"
                            }
                          />
                          {repeatMode === "one" && (
                            <View className="absolute bg-white rounded-full w-1 h-1 bottom-[-4px]" />
                          )}
                        </View>
                      </Pressable>
                  </>

                  {currentSong.platform === "APPLE_MUSIC" &&
                    Platform.OS === "web" && (
                      <Pressable
                        onPress={() => musicPlayback.setAutoplay(!autoplay)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="infinite"
                          size={22}
                          color={autoplay ? vibrant : "rgba(255,255,255,0.3)"}
                        />
                      </Pressable>
                    )}
                </View>
              </View>
            </>
          )}

          {/* Library Section */}
          <View className="w-full md:max-w-[1200px] mt-12 mb-5 px-2">
            <Text className="text-white/50 text-[14px] font-semibold uppercase tracking-[1.5px]">
              Your Library
            </Text>
            <Text className="text-white text-2xl font-bold mt-1">
              Playlists
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color={vibrant} style={{ marginTop: 40 }} />
          ) : playlists.length > 0 ? (
            <View className="w-full md:max-w-[1200px] flex-row flex-wrap justify-between px-1">
              {playlists.map((pl, index) => {
                let artworkUrl = pl.attributes?.artwork?.url || pl.artworkUrl;
                let name = pl.attributes?.name || pl.name;

                if (artworkUrl && artworkUrl.includes("{w}")) {
                  artworkUrl = artworkUrl
                    .replace("{w}", "200")
                    .replace("{h}", "200");
                }
                return (
                  <Pressable
                    key={`${pl.id}-${index}`}
                    className="w-[48%] sm:w-[31%] md:w-[23%] lg:w-[18%] mb-6 items-center"
                    onPress={() => setSelectedPlaylist(pl)}
                  >
                    {artworkUrl ? (
                      <Image
                        source={{ uri: artworkUrl }}
                        className="w-full aspect-square rounded-xl mb-2"
                      />
                    ) : (
                      <View className="w-full aspect-square rounded-xl mb-2 overflow-hidden border border-white/10">
                        <LinearGradient
                          colors={[
                            "rgba(255,255,255,0.15)",
                            "rgba(255,255,255,0.02)",
                          ]}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons
                            name="musical-notes"
                            size={32}
                            color="rgba(255,255,255,0.4)"
                          />
                        </LinearGradient>
                      </View>
                    )}
                    <Text
                      className="text-white text-sm font-semibold text-center"
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text className="text-white/40 text-sm mt-10 text-center">
              {appleMusicToken
                ? "No playlists found."
                : "Connect Apple Music to see your library."}
            </Text>
          )}
        </ScrollView>
      </Animated.View>

      {/* Playlist Detail Overlay */}
      {selectedPlaylist && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 z-100000 bg-black"
          style={{ paddingTop: insets.top }}
        >
          <View className="flex-1">
            <View className="flex-row items-center px-6 py-4 justify-between">
              <Pressable onPress={() => setSelectedPlaylist(null)} hitSlop={16}>
                <Ionicons name="chevron-back" size={28} color="white" />
              </Pressable>
              <Text className="text-white font-bold text-lg" numberOfLines={1}>
                Playlist
              </Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView className="flex-1 px-6">
              <View className="items-center mt-6 mb-8">
                <Image
                  source={{
                    uri:
                      selectedPlaylist.attributes?.artwork?.url
                        ?.replace("{w}", "600")
                        .replace("{h}", "600") || selectedPlaylist.artworkUrl,
                  }}
                  className="w-64 h-64 rounded-2xl shadow-2xl"
                />
                <Text className="text-white text-2xl font-bold mt-6 text-center">
                  {selectedPlaylist.attributes?.name || selectedPlaylist.name}
                </Text>
                <Text className="text-white/50 text-sm mt-1">
                  {playlistTracks?.length || 0} Songs
                </Text>

                <Pressable
                  className="bg-white px-10 py-3 rounded-full mt-6 active:opacity-80"
                  onPress={() => playPlaylist(selectedPlaylist.id)}
                >
                  <Text className="text-black font-bold text-lg">Play All</Text>
                </Pressable>
              </View>

              <View className="gap-4 pb-20">
                {isLoadingTracks ? (
                  <ActivityIndicator
                    color={vibrant}
                    style={{ marginTop: 20 }}
                  />
                ) : (
                  playlistTracks?.map((track: any, index: number) => (
                    <Pressable
                      key={`${track.id}-${index}`}
                      className="flex-row items-center gap-4 active:bg-white/5 p-2 rounded-xl"
                      onPress={() => playTrack(track.id)}
                    >
                      {track.artworkUrl ? (
                        <Image
                          source={{ uri: track.artworkUrl }}
                          className="w-12 h-12 rounded-lg"
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-lg bg-white/10 items-center justify-center">
                          <Ionicons
                            name="musical-notes"
                            size={20}
                            color="white/30"
                          />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text
                          className="text-white font-semibold"
                          numberOfLines={1}
                        >
                          {track.name}
                        </Text>
                        <Text
                          className="text-white/50 text-xs mt-0.5"
                          numberOfLines={1}
                        >
                          {track.artist}
                        </Text>
                      </View>
                      <Ionicons name="play" size={20} color={vibrant} />
                    </Pressable>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
};
