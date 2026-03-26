const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues ?? result.error.errors ?? [];
    const errors = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({ error: 'Validation failed.', errors });
  }

  req.body = result.data;
  next();
};

module.exports = { validate };