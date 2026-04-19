import { getAppleDeveloperToken, saveAppleUserToken } from "@/api/music.api";
import { useMusicStore } from "@/store/music.store";
import { useUserStore } from "@/store/user.store";
import { useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { APPLE_MOBILE_LOGIN_PATH } from "@/constants/API_CONSTANTS";
import { Buffer } from "buffer";

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

  const loginWithAppleMusic = async () => {
    try {
      setIsAuthenticating(true);

      if (Platform.OS === "web") {
        // --- DER ALTE WEB FLOW (Der ja funktioniert hat) ---
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
      } else {
        // --- DER NEUE MOBILE FLOW (System Browser + Deep Link) ---

        // 1. Die URL zu unserer neuen Backend-HTML-Seite
        const backendLoginUrl = APPLE_MOBILE_LOGIN_PATH;

        // 2. Wo soll der Browser uns nach dem Login hin zurückschicken?
        const redirectUrl = Linking.createURL("callback");

        // 3. Öffnet Safari nativ! (Das unterbricht die App und zeigt die Webseite)
        const result = await WebBrowser.openAuthSessionAsync(
          backendLoginUrl,
          redirectUrl,
        );

        // 4. Wenn der Deep-Link getriggert wird, fangen wir die URL ab
        if (result.type === "success" && result.url) {
          const parsedUrl = Linking.parse(result.url);
          const appleToken = parsedUrl.queryParams?.appleToken as string;

          if (appleToken) {
            await handleTokenSave(appleToken);
          } else {
            console.log("Login abgebrochen oder fehlgeschlagen.");
          }
        }
      }
    } catch (error) {
      console.error("Apple auth error:", error);
    } finally {
      setIsAuthenticating(false);
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
