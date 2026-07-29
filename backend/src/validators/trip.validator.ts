import { z } from 'zod';

export const createTripSchema = z.object({
  body: z.object({
    tripName: z.string().trim().min(1, 'Trip name is required').default('My Active Trip'),
    sourceAddress: z.string({ required_error: 'Source address is required' }).trim().min(1),
    destinationAddress: z.string({ required_error: 'Destination address is required' }).trim().min(1),
    sourceLatitude: z.coerce.number({ required_error: 'Source latitude is required' }).min(-90).max(90),
    sourceLongitude: z.coerce.number({ required_error: 'Source longitude is required' }).min(-180).max(180),
    destinationLatitude: z.coerce.number({ required_error: 'Destination latitude is required' }).min(-90).max(90),
    destinationLongitude: z.coerce.number({ required_error: 'Destination longitude is required' }).min(-180).max(180),
    travelMode: z.enum(['walking', 'driving', 'bicycling', 'transit']).default('driving'),
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    tripName: z.string().trim().min(1).optional(),
    status: z.enum(['created', 'active', 'paused', 'completed', 'cancelled']).optional(),
    riskScore: z.number().min(0).max(100).optional(),
  }),
});

export const logLocationSchema = z.object({
  body: z.object({
    tripId: z.string().uuid('Invalid trip ID format'),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    speed: z.coerce.number().default(0),
    heading: z.coerce.number().default(0),
    accuracy: z.coerce.number().default(0),
  }),
});

export const savePlaceSchema = z.object({
  body: z.object({
    placeName: z.string({ required_error: 'Place name is required' }).trim().min(1),
    latitude: z.coerce.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.coerce.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    address: z.string({ required_error: 'Address text is required' }).trim().min(1),
    category: z.enum(['home', 'office', 'custom']).default('custom'),
  }),
});
