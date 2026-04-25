import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  exchangeSpotifyToken,
  forcePlaySpotify,
  getAppleToken,
  getCurrentSpotifySong,
  pauseSpotify,
  refreshSpotifyToken,
  renderAppleMobileLogin,
  resumeSpotify,
  saveAppleMusicToken,
  skipNextSpotify,
  skipPreviousSpotify,
  testAppleMusicConnection,
} from "../controllers/musicController.js";

const router = Router();

router.get("/apple-token", protect, getAppleToken);
router.post("/apple-token/save", protect, saveAppleMusicToken);
router.get("/spotify/refresh", protect, refreshSpotifyToken);
router.post("/spotify/exchange", protect, exchangeSpotifyToken);
router.get("/spotify/current", protect, getCurrentSpotifySong);
router.post("/spotify/play", protect, forcePlaySpotify);
router.put("/spotify/resume", protect, resumeSpotify);
router.put("/spotify/pause", protect, pauseSpotify);
router.post("/spotify/next", protect, skipNextSpotify);
router.post("/spotify/previous", protect, skipPreviousSpotify);
router.get("/test-apple", protect, testAppleMusicConnection);
router.get("/apple/mobile-login", renderAppleMobileLogin);

export default router;

