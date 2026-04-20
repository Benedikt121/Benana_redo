import { prisma } from "../config/db.js";
import { RoomStatus } from "../generated/prisma/enums.js";

export const createRoom = async (hostId: string) => {
  try {
    return await prisma.room.create({
      data: {
        hostId: hostId,
      },
      include: {
        participants: {
          select: { username: true, color: true, profilePictureUrl: true },
        },
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const getRooms = async () => {
  try {
    return await prisma.room.findMany({
      where: {
        status: {
          in: ["CREATING", "ACTIVE"],
        },
        AND: {
          whoCanJoin: {
            in: ["PUBLIC", "FRIENDS_ONLY"],
          },
        },
      },
      include: {
        _count: {
          select: { participants: true },
        },
        host: {
          select: { username: true, profilePictureUrl: true },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoom = async (roomId: string) => {
  try {
    return await prisma.room.findUnique({
      where: {
        id: roomId,
        AND: {
          whoCanJoin: {
            in: ["PUBLIC", "FRIENDS_ONLY"],
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            username: true,
            color: true,
            isReady: true,
            profilePictureUrl: true,
          },
        },
        host: {
          select: { username: true, profilePictureUrl: true },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    throw error;
  }
};

export const addPlayerToRoom = async (roomId: string, userId: string) => {
  try {
    return await prisma.room.update({
      where: { id: roomId },
      data: {
        participants: {
          connect: { id: userId },
        },
      },
      include: {
        participants: {
          select: { username: true },
        },
      },
    });
  } catch (error) {
    console.error("Error adding player to room:", error);
    throw error;
  }
};

export const removePlayerFromRoom = async (roomId: string, userId: string) => {
  try {
    return await prisma.room.update({
      where: { id: roomId },
      data: {
        participants: {
          disconnect: { id: userId },
        },
      },
      include: {
        participants: {
          select: { username: true },
        },
      },
    });
  } catch (error) {
    console.error("Error removing player from room:", error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string) => {
  try {
    return await prisma.room.delete({
      where: { id: roomId },
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
};

export const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
  try {
    return await prisma.room.update({
      where: { id: roomId },
      data: { status },
    });
  } catch (error) {
    console.error("Error updating room status:", error);
    throw error;
  }
};

export const findInvitationsForRoom = async (roomId: string) => {
  try {
    return await prisma.invitation.findMany({
      where: { roomId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            color: true,
            profilePictureUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            color: true,
            profilePictureUrl: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invitations for room:", error);
    throw error;
  }
};

export const getActiveMatchForRoom = async (roomId: string) => {
  try {
    return prisma.match.findFirst({
      where: {
        roomId: roomId,
        status: "ACTIVE",
      },
      include: {
        gameDefinition: true,
        matchGame: true,
        olympiade: true,
        kniffelGame: {
          include: {
            turns: {
              orderBy: { roundNumber: "asc" },
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
        },
      },
    });
  } catch (error) {
    console.error("Error fetching active match:", error);
    throw error;
  }
};
