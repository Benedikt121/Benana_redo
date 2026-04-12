import { getAppleDeveloperToken, saveAppleUserToken } from "@/api/music.api";
import { useMusicStore } from "@/store/music.store";
import { useUserStore } from "@/store/user.store";
import { useState, useRef } from "react";
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

  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const baseWebViewRef = useRef<WebView>(null);

  const loginWithAppleMusic = async () => {
    try {
      setIsAuthenticating(true);
      const devTokenRes = await getAppleDeveloperToken();
      if (devTokenRes.status !== 200)
        throw new Error("Developer Token Fehler.");

      const developerToken = devTokenRes.data.token;
      const userToken = await promptAppleMusicUserLogin(developerToken);

      if (!userToken) throw new Error("Apple Music Login abgebrochen");

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
          resolve(instance.musicUserToken);
        } catch (error) {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
      </head>
      <body onclick="triggerLogin()" style="background-color: #000; color: white; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; cursor: pointer;">
        <h2 id="statusText">Lade Apple Music...</h2>
        <p style="opacity: 0.5; margin-top: 10px; font-size: 14px;">(Tippe auf den Bildschirm)</p>
        
        <script>
          window.open = function(url) {
            document.getElementById('statusText').innerText = 'Warte auf Anmeldung...';
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open_popup', url: url }));
            return { close: function(){}, focus: function(){} };
          };

          var hasStarted = false;
          var musicInstance = null;

          window.triggerLogin = async function() {
            if (hasStarted) return;
            hasStarted = true;
            document.getElementById('statusText').innerText = 'Öffne Login...';
            
            try {
              if (!musicInstance) {
                await MusicKit.configure({
                  developerToken: '${devToken}',
                  app: { name: 'Benana', build: '1.0.0' }
                });
                musicInstance = MusicKit.getInstance();
              }
              await musicInstance.authorize();
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: musicInstance.musicUserToken }));
            } catch (err) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
            }
          };

          setInterval(function() {
            if (musicInstance && musicInstance.musicUserToken) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: musicInstance.musicUserToken }));
            }
          }, 1000);

          document.addEventListener('musickitloaded', window.triggerLogin);
        </script>
      </body>
    </html>
  `;

  const getPopupInjectedJS = (devToken: string) => `
    var fakeOpener = {
      postMessage: function(data) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'popup_message', data: data }));
      }
    };
    try {
      Object.defineProperty(window, 'opener', { get: function() { return fakeOpener; } });
    } catch(e) { window.opener = fakeOpener; }

    var _close = window.close;
    window.close = function() {
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key && (key.includes('mut') || key.includes('token'))) {
             var val = localStorage.getItem(key);
             // DER FIX: Sichere Token-Prüfung aus dem LocalStorage
             if (val && typeof val === 'string' && val.length > 100 && !val.includes('http') && val !== '${devToken}') {
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'popup_message', data: val }));
             }
          }
        }
      } catch(e) {}

      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'popup_close' }));
      if(_close) _close.call(window);
    };
    true;
  `;

  // DER FIX: Smarter und restriktiver Token-Scanner
  const findTokenInPayload = (
    payload: any,
    devToken: string,
  ): string | null => {
    try {
      if (!payload) return null;
      const str =
        typeof payload === "string" ? payload : JSON.stringify(payload);

      // Blockiere gnadenlos jede URL
      if (
        str.includes("http://") ||
        str.includes("https://") ||
        str.includes("authorize.music")
      ) {
        return null;
      }

      // Sucht nur nach sauberen Strings (ohne / : ? & = etc.)
      const massiveStrings = str.match(/[A-Za-z0-9_.-]{100,}/g);

      if (massiveStrings) {
        for (const match of massiveStrings) {
          // Prüfen, dass wir uns nicht selbst den Developer-Token klauen
          if (
            match !== devToken &&
            !devToken.includes(match) &&
            !match.includes(devToken.substring(0, 30))
          ) {
            return match;
          }
        }
      }
    } catch (e) {}
    return null;
  };

  const AppleAuthUI = mobileWebViewData ? (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Button
          title="Abbrechen"
          onPress={() => {
            mobileWebViewData.resolve(null);
            setMobileWebViewData(null);
            setPopupUrl(null);
          }}
        />

        <View style={{ flex: popupUrl ? 0 : 1, opacity: popupUrl ? 0 : 1 }}>
          <WebView
            ref={baseWebViewRef}
            userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15"
            source={{ html: getMobileHTML(mobileWebViewData.devToken) }}
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === "open_popup") {
                  setPopupUrl(data.url);
                } else if (data.type === "success") {
                  mobileWebViewData.resolve(data.token);
                  setMobileWebViewData(null);
                  setPopupUrl(null);
                } else if (data.type === "error") {
                  mobileWebViewData.resolve(null);
                  setMobileWebViewData(null);
                  setPopupUrl(null);
                }
              } catch (e) {}
            }}
            javaScriptEnabled={true}
          />
        </View>

        {popupUrl && (
          <WebView
            source={{ uri: popupUrl }}
            userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15"
            javaScriptEnabled={true}
            injectedJavaScript={getPopupInjectedJS(mobileWebViewData.devToken)}
            // HIER WURDE DER GEFÄHRLICHE URL-SCANNER ENTFERNT!
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data);
                if (msg.type === "popup_message") {
                  const token = findTokenInPayload(
                    msg.data,
                    mobileWebViewData.devToken,
                  );
                  if (token) {
                    mobileWebViewData.resolve(token);
                    setMobileWebViewData(null);
                    setPopupUrl(null);
                  }
                } else if (msg.type === "popup_close") {
                  setPopupUrl(null);
                }
              } catch (e) {}
            }}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </Modal>
  ) : null;

  return { loginWithAppleMusic, isAuthenticating, AppleAuthUI };
};
