import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import { getAppleToken } from "../controllers/musicController.js";

const router = Router();

router.use(protect);

router.get("/apple-token", getAppleToken);

export default router;