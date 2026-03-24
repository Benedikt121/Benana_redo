import { Server, Socket } from "socket.io";
import { connectedUsers } from "./index.js";
import { prisma } from "../config/db.js";
import { Prisma, User } from "../generated/prisma/client.js";
import { checkCorrectScore } from "./utility/checkCorrectScore.js";

interface KniffelState {
  diceHistory: number[][];
  rollCount: rollCount;
}

type rollCount = 0 | 1 | 2 | 3;

export const activeMatches = new Map<string, KniffelState>();

export const registerGameHandlers = (io: Server, socket: Socket) => {
  socket.on(
    "roll_dice",
    (data: { roomId: string; matchId: string; keptIndices: number[] }) => {
      const { roomId, matchId, keptIndices } = data;

      let userId = null;
      for (const [uId, sId] of connectedUsers.entries()) {
        if (sId === socket.id) {
          userId = uId;
          break;
        }
      }
      if (!userId) return;

      let gameState = activeMatches.get(matchId);
      if (!gameState) {
        gameState = { diceHistory: [], rollCount: 0 };
      }

      if (gameState.rollCount >= 3) {
        socket.emit("game_error", { message: "You already rolled 3-times." });
        return;
      }

      let newDice;

      if (gameState.rollCount === 0) {
        newDice = Array(5)
          .fill(0)
          .map(() => Math.floor(Math.random() * 6) + 1);
      } else {
        const lastDice =
          gameState.diceHistory[gameState.diceHistory.length - 1];

        newDice = lastDice.map((die, index) => {
          if (keptIndices && keptIndices.includes(index)) {
            return die;
          }
          return Math.floor(Math.random() * 6) + 1;
        });
      }

      gameState.diceHistory.push(newDice);
      gameState.rollCount += 1;
      activeMatches.set(matchId, gameState);

      io.to(roomId).emit("dice_rolled", {
        userId,
        dice: newDice,
        rollCount: gameState.rollCount,
        keptIndices: keptIndices,
      });
    },
  );

  socket.on(
    "submit_turn",
    async (data: {
      roomId: string;
      matchId: string;
      kniffelGameId: string;
      category: string;
      score: number;
    }) => {
      const { roomId, matchId, kniffelGameId, category, score } = data;

      let userId = null;
      for (const [uId, sId] of connectedUsers.entries()) {
        if (sId === socket.id) {
          userId = uId;
          break;
        }
      }
      if (!userId) return;

      try {
        const match = await prisma.match.findUnique({
          where: { id: matchId },
          include: {
            room: { include: { participants: true } },
            kniffelGame: true,
          },
        });

        if (!match || match.currentTurnUserId !== userId) {
          socket.emit("game_error", { message: "It is not your turn!" });
          return;
        }

        const gameState = activeMatches.get(matchId);
        let diceHistory = null;
        let finalRollCount = 0;
        let calculatedScore = null;

        if (!match.kniffelGame?.isAnalog) {
          if (!gameState) {
            socket.emit("game_error", { message: "You have to roll first!" });
            return;
          }
          diceHistory = gameState.diceHistory;
          finalRollCount = gameState.rollCount;

          calculatedScore = checkCorrectScore(category, diceHistory);
        }

        const previousTurns = await prisma.kniffelTurn.count({
          where: { kniffelGameId, userId },
        });

        const roundNumber = previousTurns + 1;

        const turn = await prisma.kniffelTurn.create({
          data: {
            roundNumber,
            category,
            score: calculatedScore ? calculatedScore : score,
            rolls: diceHistory ?? Prisma.DbNull,
            rerollCount: finalRollCount,
            kniffelGameId,
            userId,
          },
        });

        activeMatches.delete(matchId);

        const participants = match.room.participants;
        const currentIndex = participants.findIndex((p: User) => p.userId === userId);
        const nextPlayer = participants[(currentIndex + 1) % participants.length];

        await prisma.match.update({
          where: { id: matchId },
          data: { currentTurnUserId: nextPlayer.id }
        })

        io.to(roomId).emit("turn_submitted", {
        turn,
        nextUserId: nextPlayer.id,
        roundNumber
      });

      if (roundNumber === 13 && currentIndex === participants.length - 1) {
        io.to(roomId).emit("game_finished", { matchId });
        
        await prisma.match.update({
          where: { id: matchId },
          data: { status: "FINISHED" }
        });
      }
      } catch (error) {
        console.error("Error submitting turn:", error);
        socket.emit("game_error", { message: "An error occurred while submitting your turn." });
      }
    },
  );
};
