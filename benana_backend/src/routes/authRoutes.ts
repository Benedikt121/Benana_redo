import { Router } from "express";
import {
  register,
  login,
  deleteUserByUsername,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.delete("/delete", deleteUserByUsername);

export default router;
