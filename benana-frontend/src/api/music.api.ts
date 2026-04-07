import axios from "axios";

export const getSpotifyTrackDetails = async (spotifyTrackId: string) => {
  const spotifyToken = useUserStore((state) => state.spotifyToken);
  const SPOTIFY_API_URL = `https://api.spotify.com/v1/tracks/${spotifyTrackId}`;
  const response = await axios.get(SPOTIFY_API_URL, {
    headers: { Authorization: `Bearer ${spotifyToken}` },
  });
  return response.data;
};

export const getAppleMusicTrackDetails = async (appleMusicTrackId: string) => {
  const appleMusicToken = useUserStore((state) => state.appleMusicToken);
  const APPLE_MUSIC_API_URL = `https://api.music.apple.com/v1/catalog/de/songs/${appleMusicTrackId}`;
  const response = await axios.get(APPLE_MUSIC_API_URL, {
    headers: { Authorization: `Bearer ${appleMusicToken}` },
  });
  return response.data;
};
