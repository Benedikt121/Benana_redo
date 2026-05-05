import { musicPlayback } from "@/services/musicPlayback.service";
import { useMusicStore } from "@/store/music.store";
import { BackendSongInfo, MusicPlatform } from "@/types/MusicTypes";

export const syncPlaybackToHost = async (hostSong: BackendSongInfo) => {
  const preferedPlatform = useMusicStore.getState().preferedPlatform;
  if (!preferedPlatform) {
    console.warn("No prefered platform found for sync");
    return;
  }

  try {
    const currentLocalSong = useMusicStore.getState().currentSong;

    const trackToPlay =
      preferedPlatform === "SPOTIFY"
        ? hostSong.spotifyTrackId
        : hostSong.appleTrackId;

    const now = Date.now();

    const hostElapsed = now - (hostSong.updatedAt || now);
    const estimatedHostTime =
      hostSong.timestamp +
      (hostSong.playbackState === "PLAYING" ? hostElapsed : 0);

    const localElapsed = now - (currentLocalSong?.updatedAt || now);
    const estimatedLocalTime =
      (currentLocalSong?.timestamp || 0) +
      (currentLocalSong?.playbackState === "PLAYING" ? localElapsed : 0);

    const isSameTrack =
      currentLocalSong?.trackId === hostSong.trackId ||
      (preferedPlatform === "SPOTIFY" &&
        currentLocalSong?.spotifyTrackId === hostSong.spotifyTrackId) ||
      (preferedPlatform === "APPLE_MUSIC" &&
        currentLocalSong?.appleTrackId === hostSong.appleTrackId);

    const timeDiff = Math.abs(estimatedLocalTime - estimatedHostTime);

    const stateChanged =
      currentLocalSong?.playbackState !== hostSong.playbackState;

    if (!isSameTrack || timeDiff > 7000 || stateChanged) {
      console.log(
        `[Sync] Triggering sync. Reason: SameTrack=${isSameTrack}, TimeDiff=${Math.round(
          timeDiff,
        )}ms, StateChanged=${stateChanged}`,
      );
      await musicPlayback.playTrack(trackToPlay!, estimatedHostTime);

      if (hostSong.playbackState === "PAUSED") {
        setTimeout(async () => {
          await musicPlayback.pause();
        }, 500);
      }
    } else {
      console.log(
        `[Sync] Skipping sync, already in sync with host (Diff: ${Math.round(
          timeDiff,
        )}ms).`,
      );
    }
  } catch (error) {
    console.error(`${preferedPlatform} Sync failed`, error);
  }
};
