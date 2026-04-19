import { redisClient } from "../config/redis.js";
import { getAppleDeveloperToken } from "./musicService.js";

const CACHE_PREFIX = "track_map:";

interface SpotifyClientTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  external_ids: { isrc?: string };
}

interface SpotifySearchResponse {
  tracks: {
    items: { id: string }[];
  };
}

interface AppleMusicSong {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    isrc?: string;
    artwork: {
      url: string;
    };
  };
}

interface AppleMusicSongsResponse {
  data?: AppleMusicSong[];
}

interface AppleMusicSearchResponse {
  results?: {
    songs?: {
      data?: { id: string }[];
    };
  };
}

interface TrackCacheValue {
  spotifyId?: string;
  appleId?: string;
  coverUrl?: string;
}

const getSpotifyClientToken = async () => {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET,
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });
  const data = (await response.json()) as SpotifyClientTokenResponse;
  return data.access_token;
};

const saveToCache = async (
  spotifyId: string,
  appleId: string,
  coverUrl: string,
) => {
  const spotifyCache: TrackCacheValue = { appleId, coverUrl };
  const appleCache: TrackCacheValue = { spotifyId, coverUrl };

  await redisClient.set(
    `${CACHE_PREFIX}spotify:${spotifyId}`,
    JSON.stringify(spotifyCache),
  );
  await redisClient.set(
    `${CACHE_PREFIX}apple:${appleId}`,
    JSON.stringify(appleCache),
  );
};

export const matchSpotifyToApple = async (
  spotifyTrackId: string,
): Promise<{ appleTrackId: string; coverUrl: string } | null> => {
  try {
    const cachedValue = await redisClient.get(
      `${CACHE_PREFIX}spotify:${spotifyTrackId}`,
    );
    if (cachedValue) {
      const parsed = JSON.parse(cachedValue) as TrackCacheValue;
      return parsed.appleId
        ? { appleTrackId: parsed.appleId, coverUrl: parsed.coverUrl ?? "" }
        : null;
    }

    const spotifyToken = await getSpotifyClientToken();
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/tracks/${spotifyTrackId}`,
      {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      },
    );

    if (!spotifyRes.ok) return null;
    const spotifyTrack = (await spotifyRes.json()) as SpotifyTrack;

    const isrc = spotifyTrack.external_ids?.isrc;
    const query = encodeURIComponent(
      `${spotifyTrack.name} ${spotifyTrack.artists[0].name}`,
    );
    const appleToken = getAppleDeveloperToken();
    let appleTrackId: string | null = null;

    if (isrc) {
      const appleIsrcRes = await fetch(
        `https://api.music.apple.com/v1/catalog/de/songs?filter[isrc]=${isrc}`,
        {
          headers: { Authorization: `Bearer ${appleToken}` },
        },
      );

      const appleIsrcData =
        (await appleIsrcRes.json()) as AppleMusicSongsResponse;
      if (appleIsrcData.data && appleIsrcData.data.length > 0)
        appleTrackId = appleIsrcData.data[0].id;
    }

    if (!appleTrackId) {
      const appleSearchRes = await fetch(
        `https://api.music.apple.com/v1/catalog/de/search?types=songs&term=${query}&limit=1`,
        {
          headers: { Authorization: `Bearer ${appleToken}` },
        },
      );
      const appleSearchData =
        (await appleSearchRes.json()) as AppleMusicSearchResponse;
      const appleSongs = appleSearchData.results?.songs?.data;
      if (appleSongs && appleSongs.length > 0) appleTrackId = appleSongs[0].id;
    }

    if (appleTrackId) {
      const appleTrackRes = await fetch(
        `https://api.music.apple.com/v1/catalog/de/songs/${appleTrackId}`,
        {
          headers: { Authorization: `Bearer ${appleToken}` },
        },
      );
      const appleTrackData =
        (await appleTrackRes.json()) as AppleMusicSongsResponse;
      let coverUrl = appleTrackData.data?.[0]?.attributes.artwork.url ?? "";
      if (coverUrl) {
        coverUrl = coverUrl.replace("{w}", "600").replace("{h}", "600");
      }

      await saveToCache(spotifyTrackId, appleTrackId, coverUrl);
      return { appleTrackId, coverUrl };
    }
    return null;
  } catch (error) {
    console.error("Error matching Spotify to Apple Music:", error);
    return null;
  }
};

export const matchAppleToSpotify = async (
  appleTrackId: string,
): Promise<{ spotifyTrackId: string; coverUrl: string } | null> => {
  try {
    const cachedValue = await redisClient.get(
      `${CACHE_PREFIX}apple:${appleTrackId}`,
    );
    if (cachedValue) {
      const parsed = JSON.parse(cachedValue) as TrackCacheValue;
      return parsed.spotifyId
        ? { spotifyTrackId: parsed.spotifyId, coverUrl: parsed.coverUrl ?? "" }
        : null;
    }

    const appleToken = getAppleDeveloperToken();
    const appleRes = await fetch(
      `https://api.music.apple.com/v1/catalog/de/songs/${appleTrackId}`,
      {
        headers: { Authorization: `Bearer ${appleToken}` },
      },
    );

    if (!appleRes.ok) return null;
    const appleData = (await appleRes.json()) as AppleMusicSongsResponse;
    if (!appleData.data || appleData.data.length === 0) return null;
    const appleTrack = appleData.data[0].attributes;

    const isrc = appleTrack.isrc;
    const trackQuery = encodeURIComponent(
      `${appleTrack.name} ${appleTrack.artistName}`,
    );
    const spotifyToken = await getSpotifyClientToken();
    let spotifyTrackId: string | null = null;

    if (isrc) {
      const spotifyIsrcRes = await fetch(
        `https://api.spotify.com/v1/search?type=track&q=isrc:${isrc}&limit=1`,
        {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        },
      );
      const spotifyIsrcData =
        (await spotifyIsrcRes.json()) as SpotifySearchResponse;
      if (spotifyIsrcData.tracks.items.length > 0)
        spotifyTrackId = spotifyIsrcData.tracks.items[0].id;
    }
    if (!spotifyTrackId) {
      const spotifySearchRes = await fetch(
        `https://api.spotify.com/v1/search?type=track&q=${trackQuery}&limit=1`,
        {
          headers: { Authorization: `Bearer ${spotifyToken}` },
        },
      );
      const spotifySearchData =
        (await spotifySearchRes.json()) as SpotifySearchResponse;
      if (spotifySearchData.tracks.items.length > 0)
        spotifyTrackId = spotifySearchData.tracks.items[0].id;
    }

    if (spotifyTrackId) {
      let coverUrl = appleData.data?.[0]?.attributes.artwork.url ?? "";
      if (coverUrl) {
        coverUrl = coverUrl.replace("{w}", "600").replace("{h}", "600");
      }
      await saveToCache(spotifyTrackId, appleTrackId, coverUrl);
      return { spotifyTrackId, coverUrl };
    }
    return null;
  } catch (error) {
    console.error("Error matching Apple Music to Spotify:", error);
    return null;
  }
};
