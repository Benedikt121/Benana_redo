import { Router } from "express";
import { deleteMe } from "../controllers/authController.js";
import { protect } from "../middlewares/protect.js";

const router = Router();

router.delete("/user", protect, deleteMe);

export default router;
