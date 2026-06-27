import { EventEmitter } from 'events';
import logger from '../utils/logger.js';

class JobQueue extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  setupListeners() {
    this.on('logAudit', async (auditData) => {
      try {
        const { createAuditLog } = await import('./audit.service.js');
        await createAuditLog(auditData);
      } catch (error) {
        logger.error(`[JobQueue] Failed to process logAudit: ${error.message}`);
      }
    });

    this.on('sendNotification', async (notificationData) => {
      try {
        const { processNotificationJob } = await import('./notification.service.js');
        await processNotificationJob(notificationData);
      } catch (error) {
        logger.error(`[JobQueue] Failed to process sendNotification: ${error.message}`);
      }
    });
  }

  // Dispatch an audit log job
  dispatchAuditLog(data) {
    this.emit('logAudit', data);
  }

  // Dispatch a notification job
  dispatchNotification(data) {
    this.emit('sendNotification', data);
  }
}

// Export a singleton instance
export const jobQueue = new JobQueue();
