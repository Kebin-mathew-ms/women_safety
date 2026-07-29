import { z } from 'zod';

export const createSafePlaceSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(1),
    category: z.string({ required_error: 'Category is required' }).trim().min(1),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    address: z.string({ required_error: 'Address is required' }).trim().min(1),
    city: z.string({ required_error: 'City is required' }).trim().min(1),
    state: z.string({ required_error: 'State is required' }).trim().min(1),
    country: z.string({ required_error: 'Country is required' }).trim().min(1),
    phone: z.string().trim().optional().nullable(),
    website: z.string().trim().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    womenOnly: z.boolean().default(false),
    cctv: z.boolean().default(false),
    securityGuard: z.boolean().default(false),
    reception24x7: z.boolean().default(false),
    parking: z.boolean().default(false),
    lightingScore: z.coerce.number().min(0).max(10).default(0),
    accessibilityScore: z.coerce.number().min(0).max(10).default(0),
    verified: z.boolean().default(false),
  }),
});

export const updateSafePlaceSchema = z.object({
  body: createSafePlaceSchema.shape.body.partial(),
});

export const createReviewSchema = z.object({
  body: z.object({
    placeId: z.string().uuid('Invalid place ID format'),
    rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5),
    lighting: z.coerce.number().int().min(1, 'Lighting score must be between 1 and 5').max(5),
    crowd: z.coerce.number().int().min(1, 'Crowd score must be between 1 and 5').max(5),
    cleanliness: z.coerce.number().int().min(1, 'Cleanliness score must be between 1 and 5').max(5),
    security: z.coerce.number().int().min(1, 'Security score must be between 1 and 5').max(5),
    comment: z.string().trim().optional().nullable(),
  }),
});

export const updateReviewSchema = z.object({
  body: createReviewSchema.shape.body.omit({ placeId: true }).partial(),
});

export const createCrimeReportSchema = z.object({
  body: z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    address: z.string({ required_error: 'Address is required' }).trim().min(1),
    category: z.string({ required_error: 'Category is required' }).trim().min(1),
    severity: z.enum(['low', 'medium', 'high']).default('medium'),
    description: z.string().trim().optional().nullable(),
    anonymous: z.boolean().default(false),
  }),
});

export const updateCrimeReportSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'resolved']).optional(),
  }),
});
