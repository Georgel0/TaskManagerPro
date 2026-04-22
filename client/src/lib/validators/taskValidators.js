import { z } from 'zod';
import { validate } from '.';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const titleField = z
  .string({ required_error: 'Title is required.' })
  .trim()
  .min(1, 'Title cannot be empty.')
  .max(100, 'Title must be at most 100 characters.');

const descriptionField = z
  .string()
  .trim()
  .max(2000, 'Description must be at most 2000 characters.')
  .optional()
  .or(z.literal(''));

const statusField = z
  .enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}.` })
  .optional();

const priorityField = z
  .enum(PRIORITIES, { message: `Priority must be one of: ${PRIORITIES.join(', ')}.` })
  .optional();

// Deadline: valid date string, not in the past. Allows empty/null.
const deadlineField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be a valid date.')
  .refine(
    (val) => new Date(val) >= new Date(new Date().toISOString().split('T')[0]),
    { message: 'Deadline cannot be in the past.' }
  )
  .optional()
  .nullable()
  .or(z.literal(''));

export const createTaskSchema = z.object({
  title: titleField,
  description: descriptionField,
  status: statusField,
  priority: priorityField,
  deadline: deadlineField,
  project_id: z
    .union([z.string(), z.number()])
    .refine((val) => val !== '' && val !== null && val !== undefined, {
      message: 'Please select a project.',
    }),
});

// For edit: all fields optional, deadline allowed to be unchanged (stripped before submit in TaskFormModal)
export const updateTaskSchema = z.object({
  title: titleField.optional(),
  description: descriptionField,
  status: statusField,
  priority: priorityField,
  deadline: deadlineField,
});

export { validate };