import { getAppleDeveloperToken, saveAppleUserToken } from "@/api/music.api";
import { useMusicStore } from "@/store/music.store";
import { useUserStore } from "@/store/user.store";
import { useState } from "react";
import { Platform } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Auth, AuthStatus } from "@lomray/react-native-apple-music";
import { APPLE_MOBILE_LOGIN_PATH } from "@/constants/API_CONSTANTS";
import { Buffer } from "buffer";
import { QUERY_KEYS } from "@/constants/QueryKeys";
import { toast } from "@/utils/toast";

declare global {
  interface Window {
    MusicKit: any;
  }
}

export const useAppleMusicAuth = () => {
  const setAppleMusicToken = useUserStore((state) => state.setAppleMusicToken);
  const setPreferedPlatform = useMusicStore(
    (state) => state.setPreferedPlatform,
  );
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  const loginWithAppleMusic = async () => {
    try {
      setIsAuthenticating(true);

      if (Platform.OS === "web") {
        const devTokenRes = await getAppleDeveloperToken();
        const developerToken = devTokenRes.token;

        if (!window.MusicKit) {
          if (typeof window !== "undefined") {
            if (!(window as any).process) (window as any).process = {};
            if (!(window as any).process.versions)
              (window as any).process.versions = {};
            if (!(window as any).Buffer) (window as any).Buffer = Buffer;
          }
          await new Promise<void>((res, rej) => {
            document.addEventListener("musickitloaded", () => res());
            const script = document.createElement("script");
            script.src =
              "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
            script.async = true;
            script.onerror = rej;
            document.head.appendChild(script);
          });
        }

        const music = await window.MusicKit.configure({
          developerToken: developerToken,
          app: { name: "Benana", build: "1.0.0" },
        });

        const instance = music || window.MusicKit.getInstance();
        await instance.authorize();

        if (instance.musicUserToken) {
          await handleTokenSave(instance.musicUserToken);
        }
      } else if (Platform.OS === "ios") {
        const status = await Auth.authorize();
        if (status === AuthStatus.AUTHORIZED) {
          await handleTokenSave("NATIVE_APPLE_MUSIC_AUTHORIZED");
          toast.success("Apple Music erfolgreich verknüpft!");
        } else {
          toast.error("Apple Music konnte nicht verknüpft werden!");
        }
      } else {
        const backendLoginUrl = APPLE_MOBILE_LOGIN_PATH;
        const redirectUrl = Linking.createURL("callback");

        const result = await WebBrowser.openAuthSessionAsync(
          backendLoginUrl,
          redirectUrl,
        );
        if (result.type === "success" && result.url) {
          const parsedUrl = Linking.parse(result.url);
          const appleToken = parsedUrl.queryParams?.appleToken as string;

          if (appleToken) {
            await handleTokenSave(appleToken);
            toast.success("Apple Music erfolgreich verknüpft!");
          } else {
            console.log("Login abgebrochen oder fehlgeschlagen.");
            toast.error("Apple Music konnte nicht verknüpft werden!");
          }
        }
      }
    } catch (error) {
      console.error("Apple auth error:", error);
      toast.error("Apple Music konnte nicht verknüpft werden!");
    } finally {
      setIsAuthenticating(false);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.ME });
    }
  };

  const handleTokenSave = async (token: string) => {
    const saveRes = await saveAppleUserToken(token);
    if (saveRes.status === "success") {
      setAppleMusicToken(token);
      setPreferedPlatform("APPLE_MUSIC");
      console.log("Apple Music erfolgreich verknüpft! Token ist in der DB.");
    } else {
      console.error("Fehler beim Speichern des Apple Music Tokens:", saveRes);
    }
  };

  return { loginWithAppleMusic, isAuthenticating, AppleAuthUI: null };
};
