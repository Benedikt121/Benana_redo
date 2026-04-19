import { fetchCurrentSpotifySong } from "@/api/music.api";
import { socketService } from "@/services/sockets.service";
import { useAuthStore } from "@/store/auth.store";
import { useFriendsStore } from "@/store/friends.store";
import { useMusicStore } from "@/store/music.store";
import { BackendSongInfo, SongInfo } from "@/types/MusicTypes";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

export const mapBackendSongToSongInfo = (data: BackendSongInfo): SongInfo => {
  return {
    trackId: data.trackId,
    title: data.trackName,
    artist: data.artist,
    timestamp: data.timestamp,
    playbackState: data.playbackState,
    platform: data.platform,
    updatedAt: data.updatedAt,
    appleTrackId: data.appleTrackId,
    spotifyTrackId: data.spotifyTrackId,
    albumCoverUrl: data.coverUrl ?? null,
  };
};

export const mapSongInfoToBackendSong = (data: SongInfo): BackendSongInfo => {
  return {
    trackId: data.trackId as string,
    trackName: data.title,
    artist: data.artist,
    timestamp: data.timestamp,
    playbackState: data.playbackState,
    platform: data.platform,
    updatedAt: data.updatedAt,
    appleTrackId: data.appleTrackId,
    spotifyTrackId: data.spotifyTrackId,
    coverUrl: data.albumCoverUrl ?? null,
  };
};

export function useMusicSync() {
  const setCurrentSong = useMusicStore((state) => state.setCurrentSong);
  const clearSong = useMusicStore((state) => state.clearSong);
  const setFriendSong = useFriendsStore((state) => state.setFriendSong);
  const clearFriendSong = useFriendsStore((state) => state.clearFriendSong);
  const preferedPlatform = useMusicStore((state) => state.preferedPlatform);
  const lastEmittedState = useRef<string | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const socket = socketService.connect();

    const onHostSync = (data: BackendSongInfo) => {
      setCurrentSong(mapBackendSongToSongInfo(data));
    };

    const onFriendUpdate = (data: {
      friendId: string;
      musicStatus: BackendSongInfo;
    }) => {
      setFriendSong(data.friendId, mapBackendSongToSongInfo(data.musicStatus));
    };

    const onFriendStopped = (data: { friendId: string }) => {
      clearFriendSong(data.friendId);
    };

    socket.on("HOST_MUSIC_SYNC", onHostSync);
    socket.on("friend_music_update", onFriendUpdate);
    socket.on("FRIEND_MUSIC_STOPPED", onFriendStopped);

    return () => {
      socket.off("HOST_MUSIC_SYNC", onHostSync);
      socket.off("friend_music_update", onFriendUpdate);
      socket.off("FRIEND_MUSIC_STOPPED", onFriendStopped);
    };
  }, []);

  useEffect(() => {
    const socket = socketService.connect();
    if (!socket || !preferedPlatform) return;

    let intervalId: NodeJS.Timeout;

    const startLocalPolling = () => {
      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(async () => {
        try {
          if (preferedPlatform === "APPLE_MUSIC") {
            if (typeof window !== "undefined" && window.MusicKit) {
              const music = window.MusicKit.getInstance();
              if (!music || !music.nowPlayingItem) return;

              const isPlaying = music.isPlaying;
              const currentPlaybackTime = music.currentPlaybackTime * 1000;
              const item = music.nowPlayingItem;

              const backendSong: BackendSongInfo = {
                platform: "APPLE_MUSIC",
                trackId: item.id,
                trackName: item.title,
                artist: item.artistName,
                playbackState: isPlaying ? "PLAYING" : "PAUSED",
                timestamp: currentPlaybackTime,
                coverUrl: item.artworkURL
                  ? item.artworkURL.replace("{w}", "600").replace("{h}", "600")
                  : null,
                updatedAt: Date.now(),
              };

              setCurrentSong(mapBackendSongToSongInfo(backendSong)); // UI SOFORT updaten!

              const stateString = `${backendSong.trackId}-${backendSong.playbackState}-${Math.floor(backendSong.timestamp / 5000)}`;
              if (lastEmittedState.current !== stateString) {
                socket.emit("music_status_update", backendSong);
                lastEmittedState.current = stateString;
              }
            }
          } else if (preferedPlatform === "SPOTIFY") {
            // LOKALES POLLING FÜR SPOTIFY
            const response = await fetchCurrentSpotifySong();

            if (!response) return;

            if (response.data) {
              const backendSong: BackendSongInfo = response.data;

              setCurrentSong(mapBackendSongToSongInfo(backendSong));

              const stateString = `${backendSong.trackId}-${backendSong.playbackState}-${Math.floor(backendSong.timestamp / 5000)}`;
              if (lastEmittedState.current !== stateString) {
                socket.emit("music_status_update", backendSong);
                lastEmittedState.current = stateString;
              }
            }
          }
        } catch (error) {}
      }, 5000);
    };

    const stopLocalPolling = () => {
      if (intervalId) clearInterval(intervalId);
    };

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (preferedPlatform === "SPOTIFY") socket.emit("STOP_SERVER_POLLING");
        startLocalPolling();
      } else if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        stopLocalPolling();
        if (preferedPlatform === "SPOTIFY")
          socket.emit("START_SERVER_POLLING", "SPOTIFY");
      }
      appState.current = nextAppState;
    });

    if (appState.current === "active") {
      startLocalPolling();
    } else if (preferedPlatform === "SPOTIFY") {
      socket.emit("START_SERVER_POLLING", "SPOTIFY");
    }

    return () => {
      stopLocalPolling();
      subscription.remove();
      if (preferedPlatform === "SPOTIFY") socket.emit("STOP_SERVER_POLLING");
    };
  }, [preferedPlatform]);
}
