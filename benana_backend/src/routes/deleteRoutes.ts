import { Router } from "express";
import { deleteUserByUsername } from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { deleteSchema } from "../middlewares/validators.js";

const router = Router();

router.delete("/user", validate(deleteSchema), deleteUserByUsername);

export default router;
