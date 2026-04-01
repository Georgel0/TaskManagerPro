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

const changeUsernameSchema = z.object({
  newUsername: z
    .string({ required_error: 'New username is required.' })
    .trim()
    .min(2, 'Username must be at least 2 characters.')
    .max(20, 'Username must be at most 20 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required.' })
      .min(1, 'Current password is required.'),

    newPassword: z
      .string({ required_error: 'New password is required.' })
      .min(4, 'New password must be at least 4 characters.')
      .max(32, 'New password must be at most 32 characters.'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  });

const deleteAccountSchema = z.object({
  password: z
    .string({ required_error: 'Password is required to delete your account.' })
    .min(1, 'Password is required to delete your account.'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required. '})
    .trim()
    .email('Please enter a valid email address.'),
});

const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Token is requierd.'}).min(1),
  userId: z.union([z.string(),z.number()]).transform(Number),
  newPassword: z
    .string({ required_error: 'Password is required.'})
    .min(4, 'Password must be at least 4 characters.')
    .max(32, 'Password must be at most 32 characters.'),
});

module.exports = {
  registerSchema,
  loginSchema,
  changeUsernameSchema,
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};