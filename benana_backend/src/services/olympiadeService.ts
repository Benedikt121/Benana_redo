import { JsonArray } from "@prisma/client/runtime/client";
import { prisma } from "../config/db.js";
import { OlyGameSelectionMode, OlyStatus } from "../generated/prisma/enums.js";
import { createMatchForRoom, createMatchGame } from "./gameService.js";

export const createOlympiade = async (
  roomId: string,
  gameSelectionMode: OlyGameSelectionMode,
  gamesPool: JsonArray,
) => {
  try {
    return await prisma.olympiade.create({
      data: {
        roomId: roomId,
        name: "Olympiade " + new Date().toLocaleDateString(),
        gameSelectionMode: gameSelectionMode || "RANDOM",
        gamesPool: gamesPool,
        status: "ACTIVE",
      },
    });
  } catch (error) {
    console.error("Failed to create Olympiade");
    throw error;
  }
};

export const getOlympiadeById = async (olympiadeId: string) => {
  try {
    return await prisma.olympiade.findUnique({
      where: { id: olympiadeId },
      include: {
        matches: {
          include: {
            results: true,
            matchGame: true,
          },
        },
        room: {
          include: { participants: true },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch Olympiade");
    throw error;
  }
};

export const submitManualMatchResult = async (
  matchId: string,
  winnerUserId: string,
  score: number,
) => {
  try {
    return await prisma.matchResult.create({
      data: {
        matchId,
        userId: winnerUserId,
        score: score,
        isWinner: true,
        rank: 1,
      },
    });
  } catch (error) {
    console.error("Failed to submit match result");
    throw error;
  }
};

export const finishOlympiade = async (olympiadeId: string) => {
  try {
    return await prisma.olympiade.update({
      where: { id: olympiadeId },
      data: { status: OlyStatus.FINISHED },
    });
  } catch (error) {
    console.error("Failed to finish Olympiade");
    throw error;
  }
};

export const startNewOlyGame = async (
  olympiadeId: string,
  matchGameId: string,
) => {
  try {
    const oly = await getOlympiadeById(olympiadeId);

    if (!oly || oly.status !== OlyStatus.ACTIVE) {
      throw new Error("Olympiade not found or not active");
    }

    const gamesPool = oly.gamesPool as string[];
    const playedGamesCount = oly.matches.length;

    if (playedGamesCount >= gamesPool.length) {
      await finishOlympiade(olympiadeId);
      return { status: "FINISHED" };
    }

    let nextGame: string;

    if (oly.gameSelectionMode === OlyGameSelectionMode.RANDOM) {
      const remainingGames = gamesPool.filter(
        (game) => !oly.matches.some((match) => match.matchGameId === game),
      );
      nextGame =
        remainingGames[Math.floor(Math.random() * remainingGames.length)];
    } else {
      nextGame = gamesPool[playedGamesCount];
    }

    const matchGame = await prisma.matchGame.findUnique({
      where: { name: nextGame },
    });

    if (!matchGame) {
      throw new Error("Match game definition not found for " + nextGame);
    }

    await createMatchForRoom(
      oly.roomId,
      matchGame!.id,
      oly.room.participants[0].id,
      false,
      matchGameId,
      olympiadeId,
    );


  } catch (error) {
    console.error("Failed to start new Olympiade game");
    throw error;
  }
};
