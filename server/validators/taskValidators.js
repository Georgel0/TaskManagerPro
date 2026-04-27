const { z } = require('zod');

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const titleField = z
  .string({ required_error: 'Title is required.' })
  .trim()
  .min(1, 'Title cannot be empty.')
  .max(100, 'Title must be at most 100 characters.');

const statusField = z
  .enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}.` })
  .optional();

const priorityField = z
  .enum(PRIORITIES, { message: `Priority must be one of: ${PRIORITIES.join(', ')}.` })
  .optional();

const deadlineField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be a date in YYYY-MM-DD format.')
  .refine(
    (val) => new Date(val) >= new Date(new Date().toISOString().split('T')[0]),
    { message: 'Deadline cannot be in the past.' }
  )
  .optional()
  .nullable()
  .or(z.literal(''));

const createTaskSchema = z.object({
  title: titleField,

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional()
    .or(z.literal('')),

  status: statusField,
  priority: priorityField,
  deadline: deadlineField,

 project_id: z.coerce
    .number({ required_error: 'project_id is required.', invalid_type_error: 'project_id must be a number.' })
    .int('project_id must be an integer.')
    .positive('project_id must be a positive number.')
    .optional(),

  assigned_user_id: z
    .number({ invalid_type_error: 'assigned_user_id must be a number.' })
    .int()
    .positive()
    .optional()
    .nullable(),
});

// All fields optional for PATCH-style updates — but still validated if provided
const updateTaskSchema = z
  .object({
    title: titleField.optional(),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    status: statusField,
    priority: priorityField,
    deadline: deadlineField,
    assigned_user_id: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    { message: 'At least one field must be provided to update.' }
  );

module.exports = { createTaskSchema, updateTaskSchema };