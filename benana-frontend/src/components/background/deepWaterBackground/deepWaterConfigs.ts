import { Platform } from "react-native";

export const WATER_CONFIG = {
  ...Platform.select({
    ios: {
      dropSize: 15,
      dropIntensity: 0.15,
      dropInterval: 0.005,
      damping: 0.9995,
      attenuation: 0.002,
      speed: 0.6,
      lightThreshold: 0.003,
    },
    android: {
      dropSize: 15,
      dropIntensity: 0.15,
      dropInterval: 0.005,
      damping: 0.9995,
      attenuation: 0.002,
      speed: 0.6,
      lightThreshold: 0.003,
    },
    web: {
      dropSize: 40,
      dropIntensity: 0.1,
      dropInterval: 0.004,
      damping: 1,
      attenuation: 0.00005,
      speed: 0.6,
      lightThreshold: 0.002,
    },
    default: {
      dropSize: 10,
      dropIntensity: 0.5,
      dropInterval: 0.0025,
      damping: 0.9995,
      attenuation: 0.00001,
      speed: 0.35,
      lightThreshold: 0.001,
    },
  }),
};
