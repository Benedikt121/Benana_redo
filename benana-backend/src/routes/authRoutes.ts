import { Router } from "express";
import { register, login, logout } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema } from "../middlewares/validators.js";
import { protect } from "../middlewares/protect.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(registerSchema), login);
router.post("/logout", protect, logout);

export default router;
