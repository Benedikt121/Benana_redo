import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getAppleToken,
  refreshSpotifyToken,
  spotifyCallback,
  spotifyLogin,
} from "../controllers/musicController.js";

const router = Router();

router.use(protect);

router.get("/apple-token", getAppleToken);
router.get("/spotify/login", spotifyLogin);
router.get("/spotify/callback", spotifyCallback);
router.get("/spotify/refresh", refreshSpotifyToken);

export default router;
