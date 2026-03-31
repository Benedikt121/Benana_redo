import { Platform } from "react-native";

export const WATER_CONFIG = {
  ...Platform.select({
    ios: {
      dropSize: 30,
      dropIntensity: 1.5,
      dropInterval: 0.008,
      damping: 0.995,
      attenuation: 0.002,
      speed: 0.8,
    },
    android: {
      dropSize: 20,
      dropIntensity: 1.5,
      dropInterval: 0.01,
      damping: 0.999,
      attenuation: 0.002,
      speed: 0.5,
    },
    web: {
      dropSize: 40,
      dropIntensity: 1.5,
      dropInterval: 0.005,
      damping: 0.995,
      attenuation: 0.002,
      speed: 1,
    },
    default: {
      dropSize: 20,
      dropIntensity: 1.5,
      dropInterval: 0.5,
      damping: 0.999,
      attenuation: 0.002,
      speed: 1,
    },
  }),
};
