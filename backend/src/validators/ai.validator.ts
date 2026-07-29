import { z } from 'zod';

export const aiChatSchema = z.object({
  body: z.object({
    question: z.string({ required_error: 'Question is required' }).trim().min(1),
    sessionId: z.string().optional(),
  }),
});

export const aiRouteAnalysisSchema = z.object({
  body: z.object({
    tripId: z.string({ required_error: 'Trip ID is required' }).uuid(),
  }),
});

export const aiHotelRecSchema = z.object({
  body: z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radiusKm: z.coerce.number().optional().default(5.0),
  }),
});

export const aiSafePlaceRecSchema = z.object({
  body: z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radiusKm: z.coerce.number().optional().default(5.0),
  }),
});

export const updatePromptSchema = z.object({
  body: z.object({
    templateName: z.enum(['system', 'route', 'hotel', 'emergency', 'review']),
    templateText: z.string({ required_error: 'Template content text is required' }).trim().min(1),
  }),
});
