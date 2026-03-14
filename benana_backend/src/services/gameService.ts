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
