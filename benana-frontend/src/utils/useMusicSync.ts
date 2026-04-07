import { useMusic } from "@/hooks/music/useMusic";
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
  };
};

export function useMusicSync() {
  const setCurrentSong = useMusicStore((state) => state.setCurrentSong);
  const clearSong = useMusicStore((state) => state.clearSong);
  const preferedPlatform = useMusicStore((state) => state.preferedPlatform);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on("HOST_MUSIC_SYNC", async (data: BackendSongInfo) => {
      console.log("🎵 Host hat den Song gewechselt:", data);
      let coverUrl: string | null = null;

      if (preferedPlatform === "APPLE_MUSIC") {
        const trackData = await useMusic().fetchAppleMusicTrackDetails;
      } else if (preferedPlatform === "SPOTIFY") {
        const trackData = await useMusic().fetchSpotifyTrackDetails;
      } else {
        console.log("Melde dich mit einem Streaming dienst an.")
      }
    });
  });
}
