import { prisma } from "../config/db.js";

export const checkFriendship = async (userId1: string, userId2: string) => {
  try {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
        status: "ACCEPTED",
      },
    });
    return !!friendship;
  } catch (error) {
    console.error("Error checking friendship:", error);
    throw error;
  }
};

export const sendFriendRequest = async (
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
    if (receiver.id === senderId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    const existingFriendship = await checkFriendship(senderId, receiver.id);
    if (existingFriendship) {
      throw new Error("You are already friends with this user");
    }

    return await prisma.friendship.create({
      data: {
        senderId,
        receiverId: receiver.id,
      },
      include: {
        sender: {
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
    console.error("Error sending friend request:", error);
    throw error;
  }
};

export const getPendingFriendRequests = async (userId: string) => {
  try {
    return await prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: {
        sender: {
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
    console.error("Error fetching pending friend requests:", error);
    throw error;
  }
};

export const getFriends = async (userId: string) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        status: "ACCEPTED",
      },
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

    return friendships.map((f) => ({
      friendshipId: f.id,
      friend: f.senderId === userId ? f.receiver : f.sender,
    }));
  } catch (error) {
    console.error("Error fetching friends:", error);
    throw error;
  }
};

export const acceptFriendRequest = async (
  friendshipId: string,
  userId: string,
) => {
  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship) {
      throw new Error("Friend request not found");
    }
    if (friendship.receiverId !== userId) {
      throw new Error("You are not authorized to accept this friend request");
    }

    return await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "ACCEPTED" },
      include: {
        receiver: {
          select: {
            username: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    throw error;
  }
};

export const deleteFriendship = async (
  friendshipId: string,
  userId: string,
) => {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });
  if (!friendship) {
    throw new Error("Friendship not found");
  }

  if (friendship.senderId !== userId && friendship.receiverId !== userId) {
    throw new Error("You are not authorized to delete this friendship");
  }

  return await prisma.friendship.delete({ where: { id: friendshipId } });
};

export const deleteOldFriendships = async () => {
  const monthago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  try {
    await prisma.friendship.deleteMany({
      where: {
        status: "PENDING",
        createdAt: { lt: monthago },
      },
    });
  } catch (error) {
    console.error("Error deleting old friendships:", error);
    throw error;
  }
};
