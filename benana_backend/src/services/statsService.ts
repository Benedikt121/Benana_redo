import { prisma } from "../config/db.js";
import { GameDefinition } from "../generated/prisma/client.js";
import { GameDefinitionModel } from "../generated/prisma/models.js";

export const getUserStats = async (userId: string) => {
  try {
    const results = await prisma.matchResult.findMany({
      where: { userId },
      include: {
        match: {
          include: { gameDefinition: true },
        },
      },
    });

    const totalGames = results.length;
    const totalWins = results.filter((r) => r.isWinner).length;

    const kniffelGames = results.filter(
      (r) => r.match.gameDefinition.name === "KNIFFEL",
    );
    const totalKniffelGames = kniffelGames.length;
    const totalKniffelWins = kniffelGames.filter((k) => k.isWinner).length;
    const kniffelWinrate =
      totalKniffelGames > 0
        ? Math.round((totalKniffelGames / totalKniffelWins) * 100)
        : 0;
    const olympiadeGames = results.filter((r) => r.match.olympiadeId !== null);
    const totalOlympiadeGames = olympiadeGames.length;
    const totalOlympiadeWins = olympiadeGames.filter((o) => o.isWinner).length;
    const olympiadeWinrate =
      totalOlympiadeGames > 0
        ? Math.round((totalOlympiadeGames / totalOlympiadeWins) * 100)
        : 0;

    const totalWinrate =
      totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    return {
      totalGames,
      totalWins,
      totalWinrate,
      totalKniffelGames,
      totalKniffelWins,
      kniffelWinrate,
      totalOlympiadeGames,
      totalOlympiadeWins,
      olympiadeWinrate,
    };
  } catch (error) {
    console.error("Failed to fetch user stats.");
    throw error;
  }
};

export const getUserHistory = async (
  userId: string,
  filter?: "KNIFFEL" | "OLYMPIADE" | "ALL",
) => {
  try {
    return await prisma.matchResult.findMany({
      where: {
        userId,
        ...(filter === "KNIFFEL" && {
          match: { gameDefinition: { name: "KNIFFEL" } },
        }),
        ...(filter === "OLYMPIADE" && {
          match: { olympiadeId: { not: null } },
        }),
      },
      orderBy: {
        match: { createdAt: "desc" },
      },
      take: 20,
      include: {
        match: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            gameDefinition: { select: { name: true } },
            matchGame: { select: { name: true } },
            olympiade: { select: { id: true, name: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch user history.");
    throw error;
  }
};

export const getMatchDetails = async (matchId: string) => {
  try {
    return await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        gameDefinition: true,
        matchGame: true,
        results: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                color: true,
                profilePictureUrl: true,
              },
            },
          },
          orderBy: { rank: "asc" },
        },
        kniffelGame: {
          include: {
            turns: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    color: true,
                    profilePictureUrl: true,
                  },
                },
              },
            },
          },
        },
        olympiade: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch match Details");
    throw error;
  }
};

export const getOlympiadeDetails = async (olympiadeId: string) => {
  try {
    return await prisma.olympiade.findUnique({
      where: { id: olympiadeId },
      include: {
        matches: {
          include: {
            matchGame: true,
            results: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    color: true,
                    profilePictureUrl: true,
                  },
                },
              },
              orderBy: { rank: "asc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch Olympiade details.");
    throw error;
  }
};
