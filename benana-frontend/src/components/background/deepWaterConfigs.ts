import { Platform } from "react-native";

export const WATER_CONFIG = {
  ...Platform.select({
    ios: {
      dropSize: 40,
      dropIntensity: 0.8,
      dropInterval: 0.005,
      damping: 0.994,
      attenuation: 0.001,
      speed: 0.9,
    },
    android: {
      dropSize: 40,
      dropIntensity: 0.8,
      dropInterval: 0.005,
      damping: 0.994,
      attenuation: 0.001,
      speed: 0.9,
    },
    web: {
      dropSize: 80,
      dropIntensity: 0.8,
      dropInterval: 0.005,
      damping: 0.994,
      attenuation: 0.001,
      speed: 0.9,
    },
    default: {
      dropSize: 60,
      dropIntensity: 0.8,
      dropInterval: 0.005,
      damping: 0.994,
      attenuation: 0.001,
      speed: 0.9,
    },
  }),
};
