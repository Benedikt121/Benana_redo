import { getAppleDeveloperToken, saveAppleUserToken } from "@/api/music.api";
import { useMusicStore } from "@/store/music.store";
import { useUserStore } from "@/store/user.store";
import { useState } from "react";
import { Platform, Modal, View, Button } from "react-native";
import { WebView } from "react-native-webview";
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
  const [mobileWebViewData, setMobileWebViewData] = useState<{
    devToken: string;
    resolve: (token: string | null) => void;
  } | null>(null);

  const loginWithAppleMusic = async () => {
    try {
      setIsAuthenticating(true);

      const devTokenRes = await getAppleDeveloperToken();
      if (devTokenRes.status !== 200)
        throw new Error("Konnte Developer Token nicht aus dem Backend holen.");
      const developerToken = devTokenRes.data.token;

      const userToken = await promptAppleMusicUserLogin(developerToken);

      if (!userToken) {
        throw new Error("User hat den Apple Music Login abgebrochen");
      }

      const saveRes = await saveAppleUserToken(userToken);

      if (saveRes.status === 200) {
        setAppleMusicToken(userToken);
        setPreferedPlatform("APPLE_MUSIC");
        console.log("Apple Music erfolgreich verknüpft!");
      }
    } catch (error) {
      console.error("Apple music Auth error:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const promptAppleMusicUserLogin = async (
    developerToken: string,
  ): Promise<string | null> => {
    return new Promise(async (resolve) => {
      if (Platform.OS === "web") {
        try {
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
              script.onload = () => res();
              script.onerror = rej;
              document.head.appendChild(script);
            });
          }

          const music = await window.MusicKit.configure({
            developerToken: developerToken,
            app: {
              name: "Benana",
              build: "1.0.0",
            },
          });

          const instance = music || window.MusicKit.getInstance();

          await instance.authorize();
          resolve(instance.musicUserToken);
        } catch (error) {
          console.error("Web MusicKit error:", error);
          resolve(null);
        }
      } else {
        setMobileWebViewData({ devToken: developerToken, resolve });
      }
    });
  };

  const getMobileHTML = (devToken: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
      </head>
      <body style="background-color: #000; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif;">
        <h2>Verbinde Apple Music...</h2>
        <script>
          document.addEventListener('musickitloaded', async function() {
            try {
              await MusicKit.configure({
                developerToken: '${devToken}',
                app: { name: 'Benana', build: '1.0.0' }
              });
              const music = MusicKit.getInstance();
              await music.authorize();
              
              // Token an React Native zurücksenden!
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: music.musicUserToken }));
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
            }
          });
        </script>
      </body>
    </html>
  `;

  const AppleAuthUI = mobileWebViewData ? (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Button
          title="Abbrechen"
          onPress={() => {
            mobileWebViewData.resolve(null);
            setMobileWebViewData(null);
          }}
        />
        <WebView
          source={{ html: getMobileHTML(mobileWebViewData.devToken) }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "success") {
                mobileWebViewData.resolve(data.token);
              } else {
                mobileWebViewData.resolve(null);
              }
            } catch (e) {
              mobileWebViewData.resolve(null);
            } finally {
              setMobileWebViewData(null); // Modal schließen
            }
          }}
          javaScriptEnabled={true}
        />
      </View>
    </Modal>
  ) : null;

  return { loginWithAppleMusic, isAuthenticating, AppleAuthUI };
};
