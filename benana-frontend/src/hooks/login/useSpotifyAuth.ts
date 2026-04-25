import { loginUserWithSpotify } from "@/api/music.api";
import { useAuthStore } from "@/store/auth.store";
import { useMusicStore } from "@/store/music.store";
import { useUserStore } from "@/store/user.store";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { toast } from "@/utils/toast";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export const useSpotifyAuth = () => {
  const setSpotifyAccessToken = useUserStore(
    (state) => state.setSpotifyAccessToken,
  );
  const setPreferedPlatform = useMusicStore(
    (state) => state.setPreferedPlatform,
  );
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const redirectUri = makeRedirectUri({
    scheme: "benanafrontend",
    path: "callback",
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId:
        process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || "Default_Client_ID",
      scopes: [
        "user-read-playback-state",
        "user-read-currently-playing",
        "user-modify-playback-state",
        "streaming",
        "user-read-email",
        "user-read-private",
      ],
      usePKCE: false,
      redirectUri,
    },
    discovery,
  );

  useEffect(() => {
    console.log(`Redirect URI (${Platform.OS}):`, redirectUri);

    if (response?.type === "success") {
      const { code } = response.params;
      console.log("Spotify Auth Code erhalten:", code);
      linkSpotifyWithBackend(code, redirectUri);
    }
  }, [response, redirectUri]);

  const linkSpotifyWithBackend = async (
    code: string,
    currentRedirectURI: string,
  ) => {
    try {
      const response = await loginUserWithSpotify(code, currentRedirectURI);
      const data = response.data;

      if (response.status === 200) {
        setSpotifyAccessToken(data.access_token);
        setPreferedPlatform("SPOTIFY");
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ME });
        toast.success("Spotify erfolgreich verknüpft!");
        console.log("Spotify login success", data.access_token);
      }
    } catch (error) {
      console.error("Spotify login Error:", error);
      toast.error("Spotify konnte nicht verknüpft werden!");
    }
  };

  return { promptAsync, isReady: !!request };
};
