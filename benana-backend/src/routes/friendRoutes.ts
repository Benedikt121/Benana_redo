import { Router } from "express";
import { protect } from "../middlewares/protect.js";
import {
  acceptRequest,
  getFriendsList,
  getRequests,
  removeFriend,
  requestFriend,
} from "../controllers/friendController.js";

const router = Router();

router.use(protect);

router.post("/request", requestFriend);
router.get("/requests", getRequests);
router.get("/", getFriendsList);
router.patch("/accept/:id", acceptRequest);
router.delete("/remove/:id", removeFriend);

export default router;
