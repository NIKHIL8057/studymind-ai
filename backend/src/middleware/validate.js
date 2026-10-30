import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const r = schema.safeParse(req[source]);
  if (!r.success) {
    const errors = {};
    for (const i of r.error.issues) errors[i.path.join('.') || '_'] ??= i.message;
    return next(new ApiError(400, Object.values(errors)[0] || 'Invalid input', errors));
  }
  req[source] = r.data;
  next();
};
