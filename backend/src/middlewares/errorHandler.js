import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`[Error] ${err.message}`, { stack: err.stack, name: err.name, code: err.code });

  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle specific known error types (e.g. Prisma, JWT)
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    message = 'A record with this value already exists.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Send standardized response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
