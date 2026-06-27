import winston from 'winston';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Custom format for console output (more readable during dev)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ level, message, timestamp, stack }) => `${timestamp} ${level}: ${message} ${stack ? '\n' + stack : ''}`
  )
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'erp-backend' },
  transports: [
    // Write all error logs to error.log
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'error.log'), 
      level: 'error' 
    }),
    // Write all logs (info and below) to combined.log
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'combined.log') 
    }),
    // Access logs will have a specific transport
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'access.log'),
      level: 'info'
    })
  ],
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Sanitization function for sensitive data in manual logs
export const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'credit_card'];
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  return sanitized;
};

export default logger;
