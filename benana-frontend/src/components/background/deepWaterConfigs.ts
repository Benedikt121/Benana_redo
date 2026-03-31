import { Platform } from "react-native";

export const WATER_CONFIG = {
  ...Platform.select({
    ios: {
      dropSize: 25, // Vorher: 15 - Reduziert für feinere Ringe
      dropIntensity: 0.15,
      dropInterval: 0.008,
      damping: 0.9995,
      attenuation: 0.002,
      speed: 0.6,
      lightThreshold: 0.003, // Vorher: 0.004
    },
    android: {
      dropSize: 8, // Vorher: 15
      dropIntensity: 0.5,
      dropInterval: 0.005,
      damping: 0.999,
      attenuation: 0.002,
      speed: 0.4,
      lightThreshold: 0.002, // Vorher: 0.004
    },
    web: {
      dropSize: 40, // Vorher: 30 - Massiv reduziert! Erzeugt viel dünnere Wellen
      dropIntensity: 0.1,
      dropInterval: 0.005,
      damping: 1,
      attenuation: 0.00005,
      speed: 0.7,
      lightThreshold: 0.002, // Vorher: 0.005 - Macht die farbige Kante schärfer/dünner
    },
    default: {
      dropSize: 10,
      dropIntensity: 0.5,
      dropInterval: 0.0025,
      damping: 0.9995,
      attenuation: 0.001,
      speed: 0.35,
      lightThreshold: 0.001,
    },
  }),
};
