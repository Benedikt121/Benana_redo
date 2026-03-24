import { JsonArray } from "@prisma/client/runtime/client";
import { prisma } from "../config/db.js";
import { OlyGameSelectionMode } from "../generated/prisma/enums.js";
import { ca } from "zod/locales";

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

