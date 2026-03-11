import { prisma } from "../config/db.js";

export const createUser = async (username: string, passwordHash: string) => {
  try {
    return await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUserByUsername = async (username: string) => {
  try {
    return await prisma.user.findUnique({
      where: { username },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const deleteUser = async (username: string) => {
  try {
    return await prisma.user.delete({
      where: { username },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
