import { Request, Response } from "express";
import {
  getMatchDetails,
  getOlympiadeDetails,
  getUserHistory,
  getUserStats,
} from "../services/statsService.js";

export const getStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const stats = await getUserStats(userId as string);
    res.status(200).json({ status: "success", data: stats });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch stats." });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const filter = req.query.filter as
      | "KNIFFEL"
      | "OLYMPIADE"
      | "ALL"
      | undefined;

    const history = await getUserHistory(userId as string, filter);
    res.status(200).json({ status: "success", data: history });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch history." });
  }
};

export const getMatchDetail = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const details = await getMatchDetails(matchId as string);

    if (!details) {
      return res
        .status(404)
        .json({ status: "error", message: "Match not found." });
    }
    res.status(200).json({ status: "success", data: details });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch match details" });
  }
};

export const getOlympiadeDetail = async (req: Request, res: Response) => {
  try {
    const { olympiadeId } = req.params;
    const details = await getOlympiadeDetails(olympiadeId as string);

    if (!details) {
      return res
        .status(404)
        .json({ status: "error", message: "Olympiade not found." });
    }
    res.status(200).json({ status: "success", data: details });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "Failed to fetch Olympiade details" });
  }
};
