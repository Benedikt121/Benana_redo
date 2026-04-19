import { forcePlaySpotify } from "@/api/music.api";
import { useAuthStore } from "@/store/auth.store";
import { BackendSongInfo, MusicPlatform } from "@/types/MusicTypes";

export const syncPlaybackToHost = async (
  hostSong: BackendSongInfo,
  myPlatform: MusicPlatform | null,
) => {
  if (!myPlatform) {
    console.warn("No prefered platform found");
    return;
  }

  if (myPlatform === "SPOTIFY") {
    try {
      const { token } = useAuthStore.getState();

      const trackToPLay = hostSong.spotifyTrackId;

      if (!trackToPLay) {
        console.warn("No spotify track id available to sync");
        return;
      }

      const response = await forcePlaySpotify(trackToPLay, hostSong.timestamp);

      if (response.status !== 200) {
        throw new Error("Sync failed, is the Spotify-App running?");
      }

      console.log("Sync successful");
    } catch (error) {
      console.error(error);
    }
  } else if (myPlatform === "APPLE_MUSIC") {
    try {
      if (typeof window !== undefined && window.MusicKit) {
        const music = window.MusicKit.getInstance();

        const trackToPlay = hostSong.appleTrackId;

        if (!trackToPlay) {
          console.warn("No apple track id available to sync");
          return;
        }
        await music.setQueue({ song: trackToPlay });

        await music.play();

        setTimeout(async () => {
          await music.seekToTime(hostSong.timestamp / 1000);
        }, 500);
      }

      console.log("Apple Music Sync successful");
    } catch (error) {
      console.error("Apple Music Sync failed", error);
    }
  }
};
