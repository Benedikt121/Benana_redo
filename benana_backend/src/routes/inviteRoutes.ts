import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  acceptInvite,
  getUserInvites,
  inviteToRoom,
  rejectInvite,
} from "../controllers/inviteController.js";

const router = Router();

router.use(protect);

router.get("/", getUserInvites);
router.post("/invite", inviteToRoom);
router.post("/accept/:inviteId", acceptInvite);
router.post("/decline/:inviteId", rejectInvite);

export default router;
