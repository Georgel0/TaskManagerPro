const { z } = require('zod');

const changeUsernameSchema = z.object({
  newUsername: z
    .string({ required_error: 'New username is required.' })
    .trim()
    .min(2, 'Username must be at least 2 characters.')
    .max(20, 'Username must be at most 20 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),
});

const changeEmailSchema = z.object({
  newEmail: z
    .string({ required_error: 'New email is required.' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address.')
    .max(150, 'Email must be at most 150 characters.'),
  password: z
    .string({ required_error: 'Password is required to change your email.' })
    .min(1, 'Password is required to change your email.'),
});

const changeAvatarSchema = z.object({
  newAvatarUrl: z
    .string({ required_error: 'Avatar URL is required.' })
    .url('Please provide a valid URL.'),
});

const changeBioSchema = {
  newBio: (value) => {
    if (value && value.length > 500) return "Bio must be under 500 characters.";
    return null;
  }
};

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

module.exports = {
  changeUsernameSchema,
  changeEmailSchema,
  changeAvatarSchema,
  changePasswordSchema,
  changeBioSchema,
  deleteAccountSchema
};