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

export default router;
