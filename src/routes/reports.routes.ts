import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { generateReportSchema, reportQuerySchema } from '../types/schemas';

const router = Router();

router.post(
  '/',
  validateRequest({ body: generateReportSchema }),
  reportsController.generateReport.bind(reportsController)
);

router.get(
  '/',
  validateRequest({ query: reportQuerySchema }),
  reportsController.listReports.bind(reportsController)
);

router.get(
  '/:id',
  reportsController.getReport.bind(reportsController)
);

router.get(
  '/:id/status',
  reportsController.getReportStatus.bind(reportsController)
);

router.get(
  '/:id/download',
  reportsController.getDownloadUrl.bind(reportsController)
);

router.delete(
  '/:id',
  reportsController.deleteReport.bind(reportsController)
);

export default router;
