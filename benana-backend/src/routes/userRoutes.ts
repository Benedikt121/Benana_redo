import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getMyUserProfile,
  getUserProfile,
  searchUsers,
  searchUsersAutoComplete,
  updateUserProfile,
  uploadProfilePicture,
} from "../controllers/userController.js";
import { uploadAvatar } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.use(protect);

router.get("/me", getMyUserProfile);
router.patch("/me", updateUserProfile);
router.get("/id/:userId", getUserProfile);
router.get("/name/:username", getUserProfile);
router.get("/names", searchUsersAutoComplete);
router.get("/search", searchUsers);
router.post("/me/avatar", uploadAvatar.single("avatar"), uploadProfilePicture);

export default router;
