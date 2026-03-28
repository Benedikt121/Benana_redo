import { Router } from "express";
import { deleteMe } from "../controllers/authController.js";
import { protect } from "../middlewares/protect.js";
import { removeRoom } from "../controllers/deleteController.js";

const router = Router();

router.delete("/user", protect, deleteMe);
router.delete("/room/:roomId", protect, removeRoom);

export default router;
