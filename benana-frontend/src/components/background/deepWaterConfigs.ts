import { Platform } from "react-native";

export const WATER_CONFIG = {
  ...Platform.select({
    ios: {
      dropSize: 15, // Deutlich kleinerer Startpunkt für den Tropfen
      dropIntensity: 0.5, // Sanfterer Einschlag, damit die Farben nicht so stark verzerren
      dropInterval: 0.002, // Häufigkeit der Tropfen bleibt gleich
      damping: 0.999, // Näher an 1.0 = Wellen erstrecken sich viel weiter nach außen
      attenuation: 0.002, // Geringere Abbremsung der Wellen auf dem Weg nach außen
      speed: 0.6, // Langsamere, entspanntere Wellenausbreitung
      lightThreshold: 0.002, // Leicht erhöhte Lichtintensität für schönere Reflexe
    },
    android: {
      dropSize: 15,
      dropIntensity: 0.5,
      dropInterval: 0.005,
      damping: 0.999,
      attenuation: 0.002,
      speed: 0.4,
      lightThreshold: 0.002,
    },
    web: {
      dropSize: 20, // Im Web (meist größere Auflösung) minimal größer, aber viel kleiner als die alten 80
      dropIntensity: 0.5,
      dropInterval: 0.005,
      damping: 0.9995, // Im Web kann die Dämpfung noch geringer sein für sehr große Bildschirme
      attenuation: 0.001,
      speed: 0.35, // Im Web oft etwas flüssiger, daher leicht langsamer
      lightThreshold: 0.002, // Im Web etwas stärkere Lichtintensität für bessere Sichtbarkeit der Reflexe
    },
    default: {
      dropSize: 15,
      dropIntensity: 0.5,
      dropInterval: 0.005,
      damping: 0.999,
      attenuation: 0.002,
      speed: 0.4,
      lightThreshold: 0.002,
    },
  }),
};
