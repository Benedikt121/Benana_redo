import { Vibrant } from "./../../node_modules/@vibrant/core/src/index";
import { CoverColors } from "@/types/ColorTypes";
import { create } from "zustand";

interface ColorState extends CoverColors {
  setColorsFromImage: (result: any) => void;
  resetColors: () => void;
}

export const useColorStore = create<ColorState>((set) => ({
  dominant: null,
  vibrant: null,
  secondary: null,
  detail: null,

  setColorsFromImage: (result: any) => {
    let newColors: Partial<CoverColors> = {};

    if (result.platform === "android") {
      newColors = {
        dominant: result.dominant || null,
        vibrant: result.vibrant || null,
        secondary: result.secondary || null,
        detail: result.detail || null,
      };
    } else if (result.platfrom === "ios") {
      newColors = {
        dominant: result.background || null,
        vibrant: result.primary || null,
        secondary: result.secondary || null,
        detail: result.detail || null,
      };
    } else {
      newColors = {
        dominant: result.dominant || null,
        vibrant: result.vibrant || null,
        secondary: result.darkVibrant || null,
        detail: result.muted || null,
      };
    }
  },
  resetColors: () =>
    set({ dominant: null, vibrant: null, secondary: null, detail: null }),
}));
