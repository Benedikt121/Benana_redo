import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import { nextGame, submitWinner } from "../controllers/olyController.js";

const router = Router();

router.use(protect);

router.post("/:id/next-game", nextGame);
router.patch("/match/:matchId/winner", submitWinner);

export default router;
