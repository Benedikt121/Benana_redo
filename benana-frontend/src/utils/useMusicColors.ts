import { useColorStore } from "@/store/color.store";
import { useMusicStore } from "@/store/music.store";
import { useEffect } from "react";
import ImageColors from "react-native-image-colors";

export function useMusicColors() {
  const albumCoverUrl = useMusicStore(
    (state) => state.currentSong?.albumCoverUrl,
  );
  const { setColorsFromImage, resetColors } = useColorStore();

  useEffect(() => {
    const fetchColors = async () => {
      if (!albumCoverUrl) {
        resetColors();
        return;
      }

      try {
        const result = await ImageColors.getColors(albumCoverUrl, {
          fallback: "#1a1a1a",
          cache: true,
          key: albumCoverUrl,
        });

        setColorsFromImage(result);
      } catch (error) {
        console.error("Fehler beim extrahieren der farben:", error);
        resetColors();
      }
    };

    fetchColors();
  }, [albumCoverUrl]);
}
