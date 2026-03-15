import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import { addGame, getAllGames } from "../controllers/gamesController.js";

const router = Router();

router.use(protect);

router.post("/addGame", addGame);
router.get("/", getAllGames);

export default router;
