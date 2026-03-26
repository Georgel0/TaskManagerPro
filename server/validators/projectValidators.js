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
});

// createProject and updateProject share the same body shape
const createProjectSchema = projectBodySchema;
const updateProjectSchema = projectBodySchema;

module.exports = { createProjectSchema, updateProjectSchema };