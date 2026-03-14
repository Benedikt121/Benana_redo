import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getMyUserProfile,
  getUserProfile,
  searchUsers,
  searchUsersAutoComplete,
  updateUserProfile,
} from "../controllers/userController.js";

const router = Router();

router.use(protect);

router.get("/me", getMyUserProfile);
router.patch("/me", updateUserProfile);
router.get("/user/:userId", getUserProfile);
router.get("/user/:username", getUserProfile);
router.get("/names", searchUsersAutoComplete);
router.get("/search", searchUsers);

export default router;
