const { z } = require('zod');

const commentField = z
  .string({ required_error: 'Comment is required.' })
  .trim()
  .min(1, 'Comment cannot be empty.')
  .max(1000, 'Comment must be at most 1000 characters.');

const createCommentSchema = z.object({
  task_id: z.number({ required_error: 'Task is required.' }),
  comment: commentField,
});

const updateCommentSchema = z.object({
  comment: commentField,
});

module.exports = { createCommentSchema, updateCommentSchema };