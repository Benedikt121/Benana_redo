import { Platform } from "react-native";

export const WATER_CONFIG = {
  ...Platform.select({
    ios: {
      dropSize: 15,
      dropIntensity: 0.5,
      dropInterval: 0.002,
      damping: 0.999,
      attenuation: 0.002,
      speed: 0.6,
      lightThreshold: 0.004,
    },
    android: {
      dropSize: 15,
      dropIntensity: 0.5,
      dropInterval: 0.005,
      damping: 0.999,
      attenuation: 0.002,
      speed: 0.4,
      lightThreshold: 0.004,
    },
    web: {
      dropSize: 30,
      dropIntensity: 0.3,
      dropInterval: 0.0025,
      damping: 0.9995,
      attenuation: 0.001,
      speed: 0.35,
      lightThreshold: 0.0007,
    },
    default: {
      dropSize: 20,
      dropIntensity: 0.5,
      dropInterval: 0.0025,
      damping: 0.9995,
      attenuation: 0.001,
      speed: 0.35,
      lightThreshold: 0.002,
    },
  }),
};
