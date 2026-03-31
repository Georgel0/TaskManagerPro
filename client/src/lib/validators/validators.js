import { z } from 'zod';

const nameField = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters.')
  .max(20, 'Name must be at most 50 characters.');

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address.');

const passwordField = z
  .string()
  .min(4, 'Password must be at least 4 characters.')
  .max(32, 'Password must be at most 32 characters.');


export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
});

export const changeUsernameSchema = z.object({
  newUsername: z
    .string()
    .trim()
    .min(2, 'Username must be at least 2 characters.')
    .max(20, 'Username must be at most 20 characters.')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username may only contain letters, numbers, and underscores.'
    ),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordField,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password.',
    path: ['newPassword'],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required.'),
});

/**
 * Runs a Zod schema against data and returns a flat { field: message } map.
 * Returns null if validation passes.
 */
export const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (result.success) return null;

  const issues = result.error.issues ?? result.error.errors ?? [];
  return issues.reduce((acc, err) => {
    const field = err.path[0];
    if (field && !acc[field]) acc[field] = err.message;
    return acc;
  }, {});
};