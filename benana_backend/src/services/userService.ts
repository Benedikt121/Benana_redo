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

export const getUserById = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

export const deleteUserById = async (id: string) => {
  try {
    return await prisma.user.delete({
      where: { id: id },
    });
  } catch (error) {
    console.error("Error deleting user by ID:", error);
    throw error;
  }
};

export const updateUserColorOrAvatar = async (
  id: string,
  color: string,
  avatar: string,
) => {
  try {
    return await prisma.user.update({
      where: { id },
      data: {
        color,
        profilePictureUrl: avatar,
      },
    });
  } catch (error) {
    console.error("Error updating user color or avatar:", error);
    throw error;
  }
};

export const getUsersByUsernameQuery = async (
  query: string,
  excludeUserId: string,
) => {
  try {
    return await prisma.user.findMany({
      where: {
        username: {
          contains: query,
        },
        id: {
          not: excludeUserId,
        },
      },
      take: 10,
      select: {
        id: true,
        username: true,
        color: true,
        profilePictureUrl: true,
      },
    });
  } catch (error) {
    console.error("Error searching users by username query:", error);
    throw error;
  }
};

export const getAllUsernams = async (excludeUserId: string) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: excludeUserId,
        },
      },
      select: {
        username: true,
      },
    });
    return users.map((user) => user.username);
  } catch (error) {
    console.error("Error fetching usernames by query:", error);
    throw error;
  }
};
