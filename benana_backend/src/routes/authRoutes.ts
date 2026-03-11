import { Router } from "express";
import {
  register,
  login,
  deleteUserByUsername,
} from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { registerSchema } from "../middlewares/validators.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(registerSchema), login);

export default router;
