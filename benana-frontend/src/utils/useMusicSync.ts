import { socketService } from "@/services/sockets.service";
import { useMusicStore } from "@/store/music.store";
import { BackendSongInfo, SongInfo } from "@/types/MusicTypes";
import { useEffect } from "react";

const mapBackendSongToSongInfo = (data: BackendSongInfo): SongInfo => {
  return {
    trackId: data.trackId,
    title: data.trackId,
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

export function useMusicSync() {
  const setCurrentSong = useMusicStore((state) => state.setCurrentSong);
  const clearSong = useMusicStore((state) => state.clearSong);
  const preferedPlatform = useMusicStore((state) => state.preferedPlatform);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on("HOST_MUSIC_SYNC", (data: BackendSongInfo) => {
      console.log("🎵 Host hat den Song gewechselt:", data);
      setCurrentSong(mapBackendSongToSongInfo(data));
    });

    socket.on(
      "friend_music_update",
      (data: { friendId: string; musicStatus: BackendSongInfo }) => {
        // setFriendSong(data.friendId, mapBackendStateToSongInfo(data.musicStatus));
      },
    );

    socket.on("FRIEND_MUSIC_STOPPED", (data: { friendId: string }) => {
      // clearFriendSong(data.friendId)
    });

    return () => {
      socket.off("HOST_MUSIC_SYNC");
      socket.off("friend_music_update");
      socket.off("FRIEND_MUSIC_STOPPED");
    };
  });
}
