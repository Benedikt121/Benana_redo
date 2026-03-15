import { Response, Request } from "express";
import {
  createMatchGame,
  getAllGamesAndGameDefs,
} from "../services/gameService.js";

export const addGame = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const newGame = await createMatchGame(name);
    res.status(200).json({ status: "succes", message: "Game created" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to create game" });
  }
};

export const getAllGames = async (req: Request, res: Response) => {
  try {
    const results = await getAllGamesAndGameDefs();

    if (!results) {
      return res
        .status(500)
        .json({ status: "error", message: "Failed to fetch games" });
    }

    const { matchGames, gameDefs } = results;

    res.status(200).json({ status: "success", data: { matchGames, gameDefs } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch games" });
  }
};
