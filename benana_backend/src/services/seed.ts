import { prisma } from "../config/db.js";

const gameDefinitions = ["KNIFFEL", "MINIGAME"];
const matchGames = ["KNIFFEL", "SPEEDRUNNERS"];

export const seed = async () => {
  try {
    for (const defName of gameDefinitions) {
      await prisma.gameDefinition.upsert({
        where: { name: defName },
        update: {},
        create: { name: defName },
      });
    }

    for (const gameName of matchGames) {
      await prisma.matchGame.upsert({
        where: { name: gameName },
        update: {},
        create: { name: gameName },
      });
    }

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Seeding failed:", error);
  }
};
