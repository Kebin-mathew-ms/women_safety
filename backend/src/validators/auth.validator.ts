import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const phoneRegex = /^\+?[0-9\s-]{10,20}$/;

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string({ required_error: 'Full name is required' }).trim().min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email address format'),
    phone: z.string({ required_error: 'Phone number is required' }).trim().regex(phoneRegex, 'Invalid phone number format (minimum 10 digits)'),
    password: z.string({ required_error: 'Password is required' }).regex(
      passwordRegex,
      'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number'
    ),
    dateOfBirth: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
    deviceName: z.string().optional(),
    deviceId: z.string().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Refresh token is required' }),
    deviceName: z.string().optional(),
    deviceId: z.string().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).trim().email('Invalid email format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Reset token is required' }),
    newPassword: z.string({ required_error: 'New password is required' }).regex(
      passwordRegex,
      'New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: 'Old password is required' }).min(1),
    newPassword: z.string({ required_error: 'New password is required' }).regex(
      passwordRegex,
      'New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().trim().regex(phoneRegex, 'Invalid phone number format').optional(),
    dateOfBirth: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export const emergencyContactSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Contact name is required' }).trim().min(1, 'Name is required'),
    phone: z.string({ required_error: 'Phone number is required' }).trim().regex(phoneRegex, 'Invalid phone number format'),
    relationship: z.string({ required_error: 'Relationship details required' }).trim().min(1, 'Relationship is required'),
    priority: z.coerce.number().int().min(1).max(5).optional(),
    isPrimary: z.boolean().optional().default(false),
  }),
});
