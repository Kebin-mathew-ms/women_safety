import { Request, Response, NextFunction } from 'express';
import prisma from '../services/db.service';
import { socketManager } from '../socket';
import ResponseHelper from '../utils/response';
import { NotFoundError } from '../utils/errors';

export const createRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { roomName, roomType, participants } = req.body; // Participants is array of target userIds

    const allUsers = Array.from(new Set([userId, ...participants]));

    if (roomType === 'private') {
      // Check if private room already exists between these 2 users
      const existing = await prisma.chatRoom.findFirst({
        where: {
          roomType: 'private',
          participants: { every: { userId: { in: allUsers } } },
        },
        include: { participants: true },
      });

      // Filter exact length match to be certain it's only these 2
      const matchedRoom = existing?.participants.length === 2 ? existing : null;

      if (matchedRoom) {
        ResponseHelper.success(res, 'Private room already exists', matchedRoom);
        return;
      }
    }

    const room = await prisma.chatRoom.create({
      data: {
        roomName: roomName || null,
        roomType: roomType || 'private',
        createdBy: userId,
        participants: {
          create: allUsers.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        participants: true,
      },
    });

    ResponseHelper.success(res, 'Chat room created successfully', room, 201);
  } catch (error) {
    next(error);
  }
};

export const listRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const rooms = await prisma.chatRoom.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { fullName: true, profileImage: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map names for private rooms dynamically to target user's name
    const mapped = rooms.map((room) => {
      let displayName = room.roomName;
      if (room.roomType === 'private') {
        const target = room.participants.find((p) => p.userId !== userId);
        displayName = target?.user?.fullName || 'Chat Member';
      }
      return {
        ...room,
        roomName: displayName,
      };
    });

    ResponseHelper.success(res, 'Chat rooms directory retrieved successfully', mapped);
  } catch (error) {
    next(error);
  }
};

export const listMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roomId } = req.params;

    const room = await prisma.chatRoom.findUnique({ where: { roomId } });
    if (!room) throw new NotFoundError('Room not found');

    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: { select: { fullName: true, profileImage: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    ResponseHelper.success(res, 'Messages index retrieved successfully', messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { roomId, messageType, message, latitude, longitude } = req.body;

    const room = await prisma.chatRoom.findUnique({ where: { roomId } });
    if (!room) throw new NotFoundError('Room not found');

    const newMessage = await prisma.message.create({
      data: {
        roomId,
        senderId: userId,
        messageType: messageType || 'text',
        message,
        latitude,
        longitude,
        readStatus: 'sent',
      },
      include: {
        sender: { select: { fullName: true } },
      },
    });

    socketManager.emitToRoom(`room:${roomId}`, 'message-sent', newMessage);
    ResponseHelper.success(res, 'Message sent successfully', newMessage, 201);
  } catch (error) {
    next(error);
  }
};
