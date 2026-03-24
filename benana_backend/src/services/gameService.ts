import { prisma } from "../config/db.js";
import { OlyGameSelectionMode } from "../generated/prisma/enums.js";
import { JsonArray } from "../generated/prisma/internal/prismaNamespace.js";

export const getGameDefinitionByName = async (name: string) => {
  try {
    return await prisma.gameDefinition.findUnique({
      where: { name },
    });
  } catch (error) {
    console.error("Error fetching game definition");
    throw error;
  }
};

export const getMatchGameDefinitionByName = async (name: string) => {
  try {
    return await prisma.matchGame.findUnique({
      where: { name },
    });
  } catch (error) {
    console.error("Error fetching match game definition");
    throw error;
  }
};

export const createMatchForRoom = async (
  roomId: string,
  gameDefId: string,
  firstTurnUserId: string,
  isAnalog: boolean,
  matchGameId: string,
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.room.update({
        where: { id: roomId },
        data: { status: "ACTIVE" },
      });

      const match = await tx.match.create({
        data: {
          roomId,
          gameDefinitionId: gameDefId,
          status: "ACTIVE",
          currentTurnUserId: firstTurnUserId,
          kniffelGame: {
            create: {
              isAnalog: isAnalog,
            },
          },
          matchGameId: matchGameId,
        },
        include: {
          kniffelGame: true,
        },
      });

      return match;
    });
  } catch (error) {
    console.error("Failed to create match", error);
    throw error;
  }
};

export const createMatchGame = async (name: string) => {
  try {
    return await prisma.matchGame.create({
      data: {
        name,
      },
    });
  } catch (error) {
    console.error("Failed to create MatchGame");
    throw error;
  }
};

export const getAllGamesAndGameDefs = async () => {
  try {
    const matchGames = await prisma.matchGame.findMany();
    const gameDefs = await prisma.gameDefinition.findMany();
    return { matchGames, gameDefs };
  } catch (error) {
    console.error("Failed to fetch games");
  }
};
