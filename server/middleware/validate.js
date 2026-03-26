const { ZodError } = require('zod');

/**
 * Middleware factory that validates req.body against a Zod schema.
 * On failure it returns 400 with a structured errors array.
 * On success it replaces req.body with the parsed (coerced + stripped) data.
 */

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({ error: 'Validation failed', errors });
  }

  // Replace body with the cleaned/coerced data
  req.body = result.data;
  next();
};

module.exports = { validate };