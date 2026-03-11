import { Router } from "express";
import { deleteUserByUsername } from "../controllers/authController.js";

const router = Router();

router.delete("/delete", deleteUserByUsername);

export default router;
