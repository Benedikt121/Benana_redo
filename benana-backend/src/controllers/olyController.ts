import { Request, Response } from "express";
import {
  finishMatch,
  getOlympiadeById,
  startNewOlyGame,
  submitManualMatchResult,
} from "../services/olympiadeService.js";
import { getMatchGameDefinitionById } from "../services/gameService.js";
import { getMatchDetails } from "../services/statsService.js";

export const nextGame = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const io = req.app.get("io");

    const olympiade = await getOlympiadeById(id as string);

    if (!olympiade) {
      return res.status(404).json({ message: "Olympiade not found" });
    }

    if (olympiade.room.hostId !== userId) {
      return res.status(403).json({ message: "Only the host can start the next game" });
    }

    const nextGame = await startNewOlyGame(id as string);

    if (!("id" in nextGame)) {
      io.to(nextGame.roomId).emit("olympiade_finished", {
        message: "Olympiade has finished",
      });
      return res.status(400).json({ message: "Olympiade finished" });
    }

    const matchGame = await getMatchGameDefinitionById(nextGame.matchGameId);

    io.to(nextGame.roomId).emit("next_oly_game", {
      roomId: nextGame.roomId,
      kniffelGame: nextGame.kniffelGame,
      game: matchGame?.name,
    });
    res.status(200).json({ message: "New Olympiade game started" });
  } catch (error) {
    console.error("Failed to start new Olympiade game", error);
    res.status(500).json({ message: "Failed to start new Olympiade game" });
  }
};

export const submitWinner = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;
    const userId = (req as any).user.id;

    const match = await getMatchDetails(matchId as string);

    if (!match || !match.olympiadeId) {
      return res.status(404).json({ message: "Match or Olympiade not found" });
    }

    if (match.status === "FINISHED") {
      return res.status(400).json({ message: "Match is already finished" });
    }

    const olympiade = await getOlympiadeById(match.olympiadeId);

    if (!olympiade) {
      return res.status(404).json({ message: "Olympiade not found" });
    }

    const room = olympiade.room;

    if (room.hostId !== userId) {
      return res.status(403).json({ message: "Only the host can submit the winner" });
    }

    const isParticipant = room.participants.some((p) => p.id === winnerId);
    if (!winnerId || !isParticipant) {
      return res.status(400).json({ message: "Winner must be a participant in the room" });
    }

    let score: number = 0;
    const olympiadeMatches = olympiade.matches.length;

    for (let i = olympiadeMatches; i > 0; i--) {
      score += i;
    }

    let rank = 1;
    for (const participant of room.participants) {
      if (participant.id === winnerId) {
        await submitManualMatchResult(matchId as string, winnerId, score, true, 1);
      } else {
        rank++;
        await submitManualMatchResult(matchId as string, participant.id, 0, false, rank);
      }
    }

    await finishMatch(matchId as string);

    const io = req.app.get("io");
    io.to(room.id).emit("winner_submitted", {
      matchId,
      winnerId,
    });

    res.status(200).json({ message: "Winner submitted successfully" });
  } catch (error) {
    console.error("Failed to submit winner", error);
    res.status(500).json({ message: "Failed to submit winner" });
  }
};
