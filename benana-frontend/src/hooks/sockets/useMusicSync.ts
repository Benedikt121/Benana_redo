import { fetchCurrentSpotifySong } from "@/api/music.api";
import { socketService } from "@/services/sockets.service";
import { useAuthStore } from "@/store/auth.store";
import { useFriendsStore } from "@/store/friends.store";
import { useMusicStore } from "@/store/music.store";
import { BackendSongInfo, SongInfo } from "@/types/MusicTypes";
import { syncPlaybackToHost } from "@/utils/syncPlaybackToHost";
import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";

export const mapBackendSongToSongInfo = (data: BackendSongInfo): SongInfo => {
  let coverUrl = data.coverUrl ?? null;
  if (coverUrl && coverUrl.includes("{w}") && coverUrl.includes("{h}")) {
    coverUrl = coverUrl.replace("{w}", "600").replace("{h}", "600");
  }

  return {
    trackId: data.trackId,
    title: data.trackName,
    artist: data.artist,
    timestamp: data.timestamp,
    length: data.length,
    playbackState: data.playbackState,
    platform: data.platform,
    updatedAt: data.updatedAt,
    appleTrackId: data.appleTrackId,
    spotifyTrackId: data.spotifyTrackId,
    albumCoverUrl: coverUrl,
  };
};

export const mapSongInfoToBackendSong = (data: SongInfo): BackendSongInfo => {
  return {
    trackId: data.trackId as string,
    trackName: data.title,
    artist: data.artist,
    timestamp: data.timestamp,
    length: data.length,
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
  const hostId = useMusicStore((state) => state.listeningToHostId);

  useEffect(() => {
    const socket = socketService.connect();

    const onHostSync = (data: BackendSongInfo) => {
      syncPlaybackToHost(data);
      setCurrentSong(mapBackendSongToSongInfo(data));
      setFriendSong(hostId!, mapBackendSongToSongInfo(data));
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
            // Apple Music Web Sync is now handled by HeadlessMusicPlayer.web.tsx
            // to support the iframe bridge architecture.
          } else if (preferedPlatform === "SPOTIFY") {
            // LOKALES POLLING FÜR SPOTIFY
            const response = await fetchCurrentSpotifySong();

            if (!response) return;

            if (response.data) {
              const backendSong: BackendSongInfo = response.data;

              setCurrentSong(mapBackendSongToSongInfo(backendSong));

              // Sync external Spotify state to our local UI store
              if ((backendSong as any).shuffle !== undefined) {
                useMusicStore
                  .getState()
                  .setShuffle((backendSong as any).shuffle);
              }
              if ((backendSong as any).repeatMode !== undefined) {
                let rMode = (backendSong as any).repeatMode;
                if (rMode === "context") rMode = "all";
                if (rMode === "track") rMode = "one";
                useMusicStore.getState().setRepeatMode(rMode);
              }

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

  useEffect(() => {
    const STALE_THRESHOLD = 5 * 60 * 1000;

    const intervalId = setInterval(() => {
      const now = Date.now();

      const currentSong = useMusicStore.getState().currentSong;
      if (
        currentSong &&
        currentSong.updatedAt &&
        now - currentSong.updatedAt > STALE_THRESHOLD
      ) {
        clearSong();
      }

      const friends = useFriendsStore.getState().friends;
      friends.forEach((friend) => {
        if (
          friend.musicState &&
          friend.musicState.updatedAt &&
          now - friend.musicState.updatedAt > STALE_THRESHOLD
        ) {
          clearFriendSong(friend.friend.id);
        }
      });
    }, 60000); // check every minute

    return () => clearInterval(intervalId);
  }, [clearSong, clearFriendSong]);
}
