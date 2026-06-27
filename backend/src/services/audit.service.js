import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

import { jobQueue } from './jobQueue.service.js';

/**
 * Log an action to the Audit Trail.
 */
export const logAction = ({ userId, action, module, oldValue = null, newValue = null, req = null }) => {
  let ipAddress = null;
  let browser = null;

  if (req) {
    ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    browser = req.headers['user-agent'] || null;
  }

  // Dispatch to the background queue immediately without blocking
  jobQueue.dispatchAuditLog({
    userId,
    action,
    module,
    oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
    newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    ipAddress,
    browser,
  });

  return true;
};

// Internal function used by the JobQueue to perform the actual DB write
export const createAuditLog = async (data) => {
  try {
    await prisma.auditLog.create({ data });
    logger.info(`Audit: [${data.module}] ${data.action} by user ${data.userId || 'Unknown'} from IP ${data.ipAddress}`);
  } catch (error) {
    logger.error(`Failed to write audit log: ${error.message}`);
  }
};

/**
 * Get audit logs with pagination and filtering.
 */
export const getAuditLogs = async ({ page = 1, limit = 20, module, action, userId, startDate, endDate, search }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (module) where.module = module;
  if (action) where.action = action;
  if (userId) where.userId = userId;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  // Basic search on old/new values text dump could be slow in PG without proper indices,
  // so we'll skip deep JSON searching and maybe just search by user or just skip general search.
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { fullName: true, email: true, role: true } }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};
