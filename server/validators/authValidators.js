const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(20, 'Name must be at most 20 characters.'),
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(4, 'Password must be at least 4 characters.')
    .max(32, 'Password must be at most 32 characters.'),
  avatar: z
    .string()
    .regex(/^data:image\/[a-z]+;base64,/, 'Avatar must be a valid base64 image.')
    .optional()
    .nullable(),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.'),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required. '})
    .trim()
    .email('Please enter a valid email address.'),
});

const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Token is requierd.'}).min(1),
  userId: z.union([z.string(), z.number()]).transform(Number),
  newPassword: z
    .string({ required_error: 'Password is required.'})
    .min(4, 'Password must be at least 4 characters.')
    .max(32, 'Password must be at most 32 characters.'),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};