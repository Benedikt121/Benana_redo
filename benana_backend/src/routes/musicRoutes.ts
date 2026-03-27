import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getAppleToken,
  refreshSpotifyToken,
  saveAppleMusicToken,
  spotifyCallback,
  spotifyLogin,
} from "../controllers/musicController.js";

const router = Router();

router.get("/apple-token", protect, getAppleToken);
router.post("/apple-token/save", protect, saveAppleMusicToken);
router.get("/spotify/login", protect, spotifyLogin);
router.get("/spotify/refresh", protect, refreshSpotifyToken);
router.get("/spotify/callback", spotifyCallback);

export default router;
