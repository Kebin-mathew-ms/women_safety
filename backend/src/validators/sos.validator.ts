import { z } from 'zod';

export const createSosSchema = z.object({
  body: z.object({
    tripId: z.string().uuid().optional().nullable(),
    latitude: z.coerce.number({ required_error: 'Latitude is required' }).min(-90).max(90),
    longitude: z.coerce.number({ required_error: 'Longitude is required' }).min(-180).max(180),
    address: z.string().trim().default('Unknown Location'),
    emergencyType: z.string().trim().default('general'),
    triggeredBy: z.enum(['user', 'voice', 'wearable', 'quick', 'manual', 'trip']).default('user'),
    voiceActivated: z.boolean().default(false),
    wearableActivated: z.boolean().default(false),
  }),
});

export const cancelSosSchema = z.object({
  body: z.object({
    sosId: z.string().uuid('Invalid SOS ID format'),
    cancelledReason: z.string().trim().min(1, 'Reason for cancellation is required'),
  }),
});

export const resolveSosSchema = z.object({
  body: z.object({
    resolvedBy: z.string().trim().min(1, 'Operator resolver name is required'),
  }),
});

export const pairWearableSchema = z.object({
  body: z.object({
    deviceName: z.string({ required_error: 'Device name is required' }).trim().min(1),
    deviceType: z.enum(['WearOS', 'custom', 'watch']).default('WearOS'),
    macAddress: z.string({ required_error: 'Mac address is required' }).trim().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, 'Invalid MAC Address format'),
  }),
});
