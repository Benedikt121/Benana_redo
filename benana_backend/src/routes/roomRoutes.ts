import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  getAllRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  newRoom,
} from "../controllers/roomController.js";

const router = Router();

router.use(protect);

router.post("/create", newRoom);
router.get("/all", getAllRooms);
router.get("/:roomId", getRoomById);
router.patch("/join/:roomId", joinRoom);
router.patch("/leave/:roomId", leaveRoom);

export default router;
