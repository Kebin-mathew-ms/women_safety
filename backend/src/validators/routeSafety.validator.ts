import { z } from 'zod';

export const routeSafetyRecommendationSchema = z.object({
  body: z.object({
    origin: z.string({ required_error: 'Origin location is required' }).trim().min(2),
    destination: z.string({ required_error: 'Destination location is required' }).trim().min(2),
    departureTime: z.string().optional().default(new Date().toISOString()),
    modeOfTransport: z.enum(['car', 'bike', 'public_transport', 'walking']).optional().default('car'),
    numberOfTravellers: z.coerce.number().optional().default(1),
    preferences: z.array(z.string()).optional().default([]),
    priority: z.enum(['safest', 'fastest', 'balanced']).optional().default('safest'),
  }),
});
