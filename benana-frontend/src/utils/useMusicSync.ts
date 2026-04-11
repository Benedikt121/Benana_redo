import { socketService } from "@/services/sockets.service";
import { useAuthStore } from "@/store/auth.store";
import { useFriendsStore } from "@/store/friends.store";
import { useMusicStore } from "@/store/music.store";
import { BackendSongInfo, SongInfo } from "@/types/MusicTypes";
import { useEffect } from "react";

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

  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    const socket = socketService.connect();

    socket.on("HOST_MUSIC_SYNC", (data: BackendSongInfo) => {
      console.log("🎵 Host hat den Song gewechselt:", data);
      setCurrentSong(mapBackendSongToSongInfo(data));
    });

    socket.on(
      "friend_music_update",
      (data: { friendId: string; musicStatus: BackendSongInfo }) => {
        setFriendSong(
          data.friendId,
          mapBackendSongToSongInfo(data.musicStatus),
        );
      },
    );

    socket.on("FRIEND_MUSIC_STOPPED", (data: { friendId: string }) => {
      clearFriendSong(data.friendId);
    });

    return () => {
      socket.off("HOST_MUSIC_SYNC");
      socket.off("friend_music_update");
      socket.off("FRIEND_MUSIC_STOPPED");
    };
  }, [token]);
}
