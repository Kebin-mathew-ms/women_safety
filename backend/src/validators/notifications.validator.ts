import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  body: z.object({
    tripAlerts: z.boolean().optional(),
    sosAlerts: z.boolean().optional(),
    weatherAlerts: z.boolean().optional(),
    trafficAlerts: z.boolean().optional(),
    communityAlerts: z.boolean().optional(),
    chatNotifications: z.boolean().optional(),
    nearbySafetyAlerts: z.boolean().optional(),
    nightTravelWarnings: z.boolean().optional(),
    emergencyUpdates: z.boolean().optional(),
    pushEnabled: z.boolean().optional(),
    soundEnabled: z.boolean().optional(),
    vibrationEnabled: z.boolean().optional(),
  }),
});

export const voiceCommandSchema = z.object({
  body: z.object({
    command: z.string({ required_error: 'Speech command string is required' }).trim().min(1),
  }),
});

export const wearableLogSchema = z.object({
  body: z.object({
    macAddress: z.string({ required_error: 'MAC Address is required' }).trim(),
    action: z.enum(['connect', 'disconnect', 'double_tap', 'fall_detected', 'battery_low']),
    batteryLevel: z.coerce.number().min(0).max(100),
  }),
});
