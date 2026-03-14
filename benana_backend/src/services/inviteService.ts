import { prisma } from "../config/db.js";

export const createInvite = async (
  roomId: string,
  senderId: string,
  receiverUsername: string,
) => {
  try {
    const receiver = await prisma.user.findUnique({
      where: {
        username: receiverUsername,
      },
    });
    if (!receiver) {
      throw new Error("Receiver not found");
    }

    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        roomId,
        senderId,
        receiverId: receiver.id,
      },
    });
    if (existingInvitation) {
      throw new Error("Invitation already sent");
    }

    return await prisma.invitation.create({
      data: {
        roomId,
        senderId,
        receiverId: receiver.id,
      },
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    throw error;
  }
};

export const findInvitationsForUser = async (userId: string) => {
  try {
    return await prisma.invitation.findMany({
      where: { receiverId: userId },
      include: {
        sender: { select: { id: true, username: true, color: true } },
        room: { select: { id: true, hostId: true } },
      },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    throw error;
  }
};

export const findInvitationById = async (invitationId: string) => {
  try {
    return await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        sender: { select: { id: true, username: true, color: true } },
        receiver: { select: { id: true, username: true, color: true } },
        room: { select: { id: true, hostId: true } },
      },
    });
  } catch (error) {
    console.error("Error fetching invitation by ID:", error);
    throw error;
  }
};

export const updateInvitation = async (
  invitationId: string,
  status: "ACCEPTED" | "REJECTED",
) => {
  try {
    const invitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status },
    });

    if (status === "ACCEPTED") {
      await prisma.room.update({
        where: { id: invitation.roomId },
        data: {
          participants: {
            connect: { id: invitation.receiverId },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error accepting invitation:", error);
    throw error;
  }
};

export const deleteOldInvitations = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await prisma.invitation.deleteMany({
      where: {
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });
  } catch (error) {
    console.error("Error deleting old invitations:", error);
    throw error;
  }
};
