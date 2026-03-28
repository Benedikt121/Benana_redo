import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getHistory,
  getMatchDetail,
  getOlympiadeDetail,
  getStats,
} from "../controllers/statsController.js";

const router = Router();

router.use(protect);

router.get("/user/:userId/overview", getStats);
router.get("/user/:userId/history", getHistory); // optionaler Filter: ?filter=KNIFFEL

router.get("/match/:matchId", getMatchDetail);
router.get("/olympiade/:olympiadeId", getOlympiadeDetail);

export default router;
