import {
  getAppleMusicTrackDetails,
  getSpotifyTrackDetails,
} from "@/api/music.api";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function useMusic() {
  const [trackId, setTrackId] = useState<string | null>(null);

  const fetchAppleMusicTrackDetails = useQuery({
    queryKey: QUERY_KEYS.MUSIC.APPLE_MUSIC_TRACK(trackId as string),
    queryFn: () => getAppleMusicTrackDetails(trackId as string),
    enabled: !!trackId,
  });

  const fetchSpotifyTrackDetails = useQuery({
    queryKey: QUERY_KEYS.MUSIC.SPOTIFY_TRACK(trackId as string),
    queryFn: () => getSpotifyTrackDetails(trackId as string),
    enabled: !!trackId,
  });

  return {
    trackId,
    setTrackId,
    fetchAppleMusicTrackDetails,
    fetchSpotifyTrackDetails,
  };
}
