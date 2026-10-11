import { z } from 'zod';

const postBodySchema = z.object({
  title: z.string({ required_error: 'Title is required' }).trim().min(1, 'Title is required').max(150),
  description: z.string().trim().optional(),
  content: z.string().trim().optional(),
  category: z.string().trim().optional().default('travel_experience'),
  anonymous: z.boolean().default(false),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  address: z.string().trim().optional().nullable(),
  visibility: z.string().default('public'),
});

export const createPostSchema = z.object({
  body: postBodySchema,
});

export const updatePostSchema = z.object({
  body: postBodySchema.partial(),
});

export const createCommentSchema = z.object({
  body: z.object({
    postId: z.string().uuid('Invalid post ID format'),
    comment: z.string({ required_error: 'Comment text is required' }).trim().min(1).max(1000),
  }),
});

export const updateCommentSchema = z.object({
  body: z.object({
    comment: z.string({ required_error: 'Comment text is required' }).trim().min(1).max(1000),
  }),
});

export const createLikeSchema = z.object({
  body: z.object({
    postId: z.string().uuid('Invalid post ID format'),
  }),
});

export const createRoomSchema = z.object({
  body: z.object({
    roomName: z.string().trim().optional().nullable(),
    roomType: z.enum(['private', 'group', 'safety', 'emergency']).default('private'),
    participants: z.array(z.string().uuid()).min(1, 'At least one participant is required'),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    roomId: z.string().uuid('Invalid room ID format'),
    messageType: z.enum(['text', 'image', 'location', 'emergency']).default('text'),
    message: z.string().trim().optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  }),
});
