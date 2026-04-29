const { z } = require('zod');

const projectBodySchema = z.object({
  name: z
    .string({ required_error: 'Project name is required.' })
    .trim()
    .min(1, 'Project name cannot be empty.')
    .max(100, 'Project name must be at most 100 characters.'),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional()
    .or(z.literal('')),

  tags: z
    .array(z.string().trim().max(20, 'Each tag must be short'))
    .max(5, 'You can only have up to 5 tags')
    .optional()
    .default([]),

  color: z
    .string()
    .trim()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
    .optional()
    .nullable(),
});

// createProject and updateProject share the same body shape
const createProjectSchema = projectBodySchema;
const updateProjectSchema = projectBodySchema;

const addMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is requierd.' })
    .trim()
    .email('Must be a valid email address')
    .max(150, 'Email must be at most 150 characters.'),
});

module.exports = { createProjectSchema, updateProjectSchema, addMemberSchema };