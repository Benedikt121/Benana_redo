import { socketService } from "@/services/sockets.service";
import { useAuthStore } from "@/store/auth.store";
import { useFriendsStore } from "@/store/friends.store";
import { useMusicStore } from "@/store/music.store";
import { BackendSongInfo, SongInfo } from "@/types/MusicTypes";
import { useEffect, useRef } from "react";

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
  const lastEmitedState = useRef<string | null>(null);

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

    if (preferedPlatform === "APPLE_MUSIC") {
      intervalId = setInterval(() => {
        try {
          if (typeof window !== "undefined" && window.MusicKit) {
            const music = window.MusicKit.getInstance();

            if (!music || !music.nowPlayingItem) return;
            const isPlaying = music.isPlaying;
            const currentPlaybackTime = music.currentPlaybackTime * 1000;
            const item = music.nowPlayingItem;

            const currentSong: SongInfo = {
              platform: "APPLE_MUSIC",
              trackId: item.id as string,
              title: item.title as string,
              artist: item.artistName as string,
              timestamp: currentPlaybackTime,
              playbackState: isPlaying ? "PLAYING" : "PAUSED",
              updatedAt: Date.now(),
              appleTrackId: item.id,
              spotifyTrackId: null,
              albumCoverUrl: item.artwork?.url,
            }

            setCurrentSong(currentSong);

            const backendSong = mapSongInfoToBackendSong(currentSong);
            const stateString = `${backendSong.trackId}-${backendSong.playbackState}-${Math.floor(backendSong.timestamp / 5000)}`;

            if (lastEmitedState.current !== stateString) {
              socket.emit("music_status_update", backendSong);
              lastEmitedState.current = stateString;
            }
          }
        } catch (error) {
          console.error("Error while fetching music state:", error);
        }
      }, 1000)
    } else if (preferedPlatform === "SPOTIFY") {
      socket.emit("START_SERVER_POLLING", "SPOTIFY");
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (preferedPlatform === "SPOTIFY") {
        socket.emit("STOP_SERVER_POLLING")
      }
    }
  }, [preferedPlatform])
}
