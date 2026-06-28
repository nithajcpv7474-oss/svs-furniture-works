import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import rateLimit from 'express-rate-limit';
import { sanitizeInput, preventParameterPollution } from './middlewares/security.middleware.js';

// 1. Environment Variable Validation
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  console.error('FATAL ERROR: Required environment variables are missing.');
  process.exit(1);
}

const app = express();

// 2. Security Middlewares
// Trust proxy if behind a load balancer (useful for rate limiting)
app.set('trust proxy', 1);

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'https://svs-furniture-works.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Enable Response Compression
app.use(compression({
  level: 6,
  threshold: 10 * 1024, // only compress > 10kb
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Performance Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      logger.warn(`SLOW QUERY: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// Configure Helmet completely
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http://localhost:5005"], // Allow local uploads
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter); // Apply to all API routes

// Data Sanitization against XSS
app.use(sanitizeInput);

// Prevent HTTP Parameter Pollution
app.use(preventParameterPollution);

// Logging
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'guest';
});

const morganFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import customerRoutes from './routes/customer.routes.js';
import orderRoutes from './routes/order.routes.js';
import materialRoutes from './routes/material.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import reportRoutes from './routes/report.routes.js';
import productionRoutes from './routes/production.routes.js';
import deliveryRoutes from './routes/delivery.routes.js';
import userRoutes from './routes/user.routes.js';
import settingRoutes from './routes/setting.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import auditRoutes from './routes/audit.routes.js';

// Specific rate limiter for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests
  message: 'Too many login attempts from this IP, please try again after 15 minutes.'
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// Expose uploads statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic route for health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend is running successfully.' });
});

// Error handling middleware
import { errorHandler } from './middlewares/errorHandler.js';
app.use(errorHandler);

export default app;
