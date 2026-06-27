import * as auditService from '../services/audit.service.js';
import { generateAuditPdfStream } from '../services/pdf.service.js';
import logger from '../utils/logger.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { module, action, userId, startDate, endDate, search } = req.query;

    const result = await auditService.getAuditLogs({
      page,
      limit,
      module,
      action,
      userId,
      startDate,
      endDate,
      search
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const logClientExport = async (req, res, next) => {
  try {
    const { module, title } = req.body;
    
    await auditService.logAction({
      userId: req.user.id,
      action: 'Export',
      module: module || 'Reports',
      newValue: { exportedFile: title || 'Data Export' },
      req
    });

    res.json({ success: true, message: 'Export logged successfully.' });
  } catch (error) {
    next(error);
  }
};

export const exportPdf = async (req, res, next) => {
  try {
    logger.info('PDF Export request started', { user: req.user.id, filters: req.query });
    
    // We want to fetch all matching logs without typical pagination limits.
    // Fetch a large number of logs (e.g. up to 10000) for the report.
    const { module, action, userId, startDate, endDate, search } = req.query;

    const result = await auditService.getAuditLogs({
      page: 1,
      limit: 10000,
      module,
      action,
      userId,
      startDate,
      endDate,
      search
    });

    const logs = result.logs || [];
    logger.info(`Data fetched for PDF export. Count: ${logs.length}`);

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-trail-report.pdf"');

    // Generate and pipe the PDF
    await generateAuditPdfStream(logs, req.user, req.query, res);
    
    logger.info('PDF generated and downloaded successfully.');
  } catch (error) {
    logger.error('Export failure:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to generate PDF.' });
    }
  }
};
