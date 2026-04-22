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