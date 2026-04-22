import { z } from 'zod';
import { validate } from './authValidators';

const projectNameField = z
  .string({ required_error: 'Project name is required.' })
  .trim()
  .min(1, 'Project name cannot be empty.')
  .max(100, 'Project name must be at most 100 characters.');

const projectDescriptionField = z
  .string()
  .trim()
  .max(2000, 'Description must be at most 2000 characters.')
  .optional()
  .or(z.literal(''));

export const createProjectSchema = z.object({
  name: projectNameField,
  description: projectDescriptionField,
});

export const updateProjectSchema = z.object({
  name: projectNameField,
  description: projectDescriptionField,
});

export const addMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .email('Please enter a valid email address.')
    .max(150, 'Email must be at most 150 characters.'),
});

export { validate };