import React, { useEffect, useRef } from "react";
import { useMusicStore } from "../../store/music.store";
import { useUserStore } from "../../store/user.store";
import {
  getAppleDeveloperToken,
  saveAppleUserToken,
} from "../../api/music.api";
import { toast } from "../../utils/toast";
import { SongInfo, PlaybackState } from "../../types/MusicTypes";
import { queryClient } from "@/app/_layout";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { socketService } from "../../services/sockets.service";
import { mapSongInfoToBackendSong } from "../../hooks/sockets/useMusicSync";

export default function HeadlessMusicPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = React.useState(false);
  const { setPlaybackState, setCurrentSong } = useMusicStore((state) => state);
  const appleMusicUserToken = useUserStore(
    (state) => state.profile?.appleMusicUserToken,
  );
  const lastEmittedStateRef = useRef<string | null>(null);

  const sendCommand = (type: string, payload: any = {}) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type, payload }, "*");
    }
  };

  // Configure MusicKit when the library is loaded
  useEffect(() => {
    if (isLibraryLoaded) {
      const configure = async () => {
        try {
          const devToken = await getAppleDeveloperToken();
          sendCommand("CONFIGURE", {
            token: devToken.token,
            musicUserToken: appleMusicUserToken, // Can be undefined
          });
        } catch (err) {
          console.error("Failed to configure MusicKit:", err);
        }
      };
      configure();
    }
  }, [isLibraryLoaded, appleMusicUserToken]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const { type, item, state, message, token } = event.data;

      switch (type) {
        case "MUSICKIT_LOADED":
          setIsLibraryLoaded(true);
          break;

        case "NOW_PLAYING":
          if (item) {
            const songInfo: SongInfo = {
              trackId: item.id,
              appleTrackId: item.id,
              title: item.name || "Unknown Title",
              artist: item.artistName || "Unknown Artist",
              albumCoverUrl: item.artwork?.url
                ? item.artwork.url.replace("{w}", "600").replace("{h}", "600")
                : null,
              timestamp: (event.data.currentPlaybackTime || 0) * 1000,
              length: item.durationInMillis || 0,
              playbackState:
                useMusicStore.getState().currentSong?.playbackState ||
                "PLAYING",
              platform: "APPLE_MUSIC",
              updatedAt: Date.now(),
            };
            setCurrentSong(songInfo);

            // Broadcast status to friends via socket
            const socket = socketService.connect();
            const backendSong = mapSongInfoToBackendSong(songInfo);
            const stateString = `${backendSong.trackId}-${backendSong.playbackState}-${Math.floor(backendSong.timestamp / 5000)}`;
            if (lastEmittedStateRef.current !== stateString) {
              socket.emit("music_status_update", backendSong);
              lastEmittedStateRef.current = stateString;
            }
          }
          break;

        case "PLAYBACK_STATE_CHANGED":
          const mappedState: PlaybackState = state === 2 ? "PLAYING" : "PAUSED";
          const current = useMusicStore.getState().currentSong;
          if (current) {
            const updatedSong: SongInfo = {
              ...current,
              playbackState: mappedState,
              timestamp: (event.data.currentPlaybackTime || 0) * 1000,
              updatedAt: Date.now(),
            };
            setCurrentSong(updatedSong);

            // Broadcast status to friends via socket
            const socket = socketService.connect();
            const backendSong = mapSongInfoToBackendSong(updatedSong);
            const stateString = `${backendSong.trackId}-${backendSong.playbackState}-${Math.floor(backendSong.timestamp / 5000)}`;
            if (lastEmittedStateRef.current !== stateString) {
              socket.emit("music_status_update", backendSong);
              lastEmittedStateRef.current = stateString;
            }
          } else {
            setPlaybackState(mappedState);
          }
          break;

        case "AUTHORIZED":
          if ((window as any).resolveAuth) {
            (window as any).resolveAuth(token);
            (window as any).resolveAuth = null;
          }
          // Save the new token to the backend automatically
          if (token) {
            saveAppleUserToken(token)
              .then(() => {
                // Re-fetch user profile to update the store
                queryClient.invalidateQueries({
                  queryKey: QUERY_KEYS.USER.ME,
                });
              })
              .catch((err) => {
                console.error("Failed to save Apple Music token:", err);
              });
          }
          break;

        case "PLAYLISTS_FETCHED":
          if ((window as any).resolvePlaylists) {
            (window as any).resolvePlaylists(event.data.playlists);
            (window as any).resolvePlaylists = null;
          }
          break;

        case "PLAYLIST_TRACKS_FETCHED":
          if ((window as any).resolvePlaylistTracks) {
            (window as any).resolvePlaylistTracks(event.data.tracks);
            (window as any).resolvePlaylistTracks = null;
          }
          break;

        case "ERROR":
          console.error("MusicKit Iframe Error:", message);
          toast.error(`Music Player Error: ${message}`);
          if ((window as any).resolvePlaylists) {
            (window as any).resolvePlaylists([]);
            (window as any).resolvePlaylists = null;
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setCurrentSong, setPlaybackState]);

  useEffect(() => {
    // @ts-ignore
    window.sendMusicCommand = sendCommand;
    return () => {
      // @ts-ignore
      delete window.sendMusicCommand;
    };
  }, []);

  return React.createElement("iframe", {
    id: "headless-player",
    ref: iframeRef,
    src: "/headless_player.html",
    style: {
      width: 0,
      height: 0,
      border: "none",
      position: "absolute",
      opacity: 0,
      pointerEvents: "none",
    },
    allow: "autoplay; encrypted-media",
  });
}
