import multer from 'multer';
import { env } from '../config/env.js';

export const notFound = (_req, res) => res.status(404).json({ success: false, message: 'Route not found' });

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500;
  let message = err.message;
  const errors = err.errors;

  if (err instanceof multer.MulterError) {
    status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? `File is too large (max ${env.maxFileMb} MB).` : 'Upload failed.';
  } else if (err.name === 'CastError') {
    status = 404;
    message = 'Not found';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Some fields are invalid.';
  } else if (err.code === 11000) {
    status = 409;
    message = 'That value is already in use.';
  } else if (!err.status) {
    // Log the message only: never the stack, request body or document content.
    console.error(`[error] ${req.method} ${req.path}: ${err.message}`);
    status = 500;
    message = 'Something went wrong. Please try again.';
  }
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
}
