import { Platform } from "react-native";

export const RAINY_CONFIG = {
  ...Platform.select({
    ios: {
      intensity: 0.5,
      speed: 0.2,
      brightness: 0.5,
      normal: 0.8,
      zoom: 2.2,
      blurIntensity: 4,
      blurIterations: 4,
    },
    android: {
      intensity: 0.5,
      speed: 0.2,
      brightness: 0.5,
      normal: 0.8,
      zoom: 2.2,
      blurIntensity: 4,
      blurIterations: 4,
    },
    web: {
      intensity: 0.5,
      speed: 0.2,
      brightness: 0.5,
      normal: 0.8,
      zoom: 2.2,
      blurIntensity: 5.0,
      blurIterations: 32,
    },
    default: {
      intensity: 0.5,
      speed: 0.2,
      brightness: 0.6,
      normal: 0.8,
      zoom: 2.2,
      blurIntensity: 2.5,
      blurIterations: 24,
    },
  }),
};
