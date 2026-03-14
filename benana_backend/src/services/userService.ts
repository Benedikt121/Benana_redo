import { prisma } from "../config/db.js";

const safeUserSelect = {
  id: true,
  username: true,
  color: true,
  profilePictureUrl: true,
  createdAt: true,
  currentRoomId: true,
  isReady: true,
};

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

export function getUserByUsername(
  username: string,
  withPassword: true,
): Promise<{
  id: string;
  username: string;
  color: string;
  profilePictureUrl: string | null;
  createdAt: Date;
  currentRoomId: true;
  isReady: true;
  passwordHash: string;
} | null>;

export function getUserByUsername(
  username: string,
  withPassword?: false,
): Promise<{
  id: string;
  username: string;
  color: string;
  profilePictureUrl: string | null;
  createdAt: Date;
  currentRoomId: true;
  isReady: true;
} | null>;

export async function getUserByUsername(
  username: string,
  withPassword: boolean = false,
) {
  try {
    if (withPassword === false) {
      return await prisma.user.findUnique({
        where: { username },
        select: safeUserSelect,
      });
    }

    return await prisma.user.findUnique({
      where: { username },
      select: {
        ...safeUserSelect,
        passwordHash: true,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

export function getUserById(
  id: string,
  withPassword: true,
): Promise<{
  id: string;
  username: string;
  color: string;
  profilePictureUrl: string | null;
  createdAt: Date;
  currentRoomId: true;
  isReady: true;
  passwordHash: string;
} | null>;

export function getUserById(
  id: string,
  withPassword?: false,
): Promise<{
  id: string;
  username: string;
  color: string;
  profilePictureUrl: string | null;
  createdAt: Date;
  currentRoomId: true;
  isReady: true;
} | null>;

export async function getUserById(id: string, withPassword: boolean = false) {
  try {
    if (withPassword === false) {
      return await prisma.user.findUnique({
        where: { id },
        select: safeUserSelect,
      });
    }
    return await prisma.user.findUnique({
      where: { id },
      select: {
        ...safeUserSelect,
        passwordHash: true,
      },
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

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
      select: safeUserSelect,
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
      select: safeUserSelect,
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

export const updateIsReady = async (userId: string, isReady: boolean) => {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { isReady: isReady },
      select: {
        id: true,
        username: true,
        isReady: true,
      },
    });
  } catch (error) {
    console.error("Error changing ready status.", error);
    throw error;
  }
};
