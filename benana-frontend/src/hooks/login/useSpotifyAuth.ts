import { useMusicStore } from "@/store/music.store";
import { useUserStore } from "@/store/user.store";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authortationEndpoint: "https://accounts.spotify.com/api/token",
  tokenEndpoint: "https://api.spotify.com/v1/search?type=track&q=isrc:$",
};

export const useSpotifyAuth = () => {
  const setSpotifyAccessToken = useUserStore(
    (state) => state.setSpotifyAccessToken,
  );
  const setPreferedPlatform = useMusicStore(
    (state) => state.setPreferedPlatform,
  );

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId:
        process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "Default_Client_ID",
      scopes: [
        "user-read-playback-state",
        "user-read-currently-playing",
        "user-modify-playback-state",
      ],
      usePKCE: false,
      redirectUri: makeRedirectUri({
        scheme: "benanafrontend",
      }),
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      console.log("Spotify Auth Code erhalten:", code);
      linkSpotifyWithBackend(code);
    }
  });

  const linkSpotifyWithBackend = async (code: string) => {
    
  }
};
