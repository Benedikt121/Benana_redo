import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getAllRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  newRoom,
  getRoomInvites,
  startRoom,
  toggleReady,
  kickPlayer,
  getCurrentMatch,
} from "../controllers/roomController.js";

const router = Router();

router.use(protect);

router.post("/create", newRoom);
router.get("/all", getAllRooms);
router.get("/:roomId", getRoomById);
router.patch("/join/:roomId", joinRoom);
router.patch("/leave", leaveRoom);
router.get("/invites/:roomId", getRoomInvites);
router.patch("/start", startRoom);
router.patch("/ready", toggleReady);
router.delete("/kick/:userId", kickPlayer);
router.get("/:roomId/current-match", getCurrentMatch);

export default router;
