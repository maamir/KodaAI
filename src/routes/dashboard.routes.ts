import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { dashboardDataSchema } from '../types/schemas';

const router = Router();

// GET /api/dashboard/:viewType - Get dashboard data for specific view
router.get(
  '/:viewType',
  validateRequest({ query: dashboardDataSchema }),
  dashboardController.getDashboardData.bind(dashboardController)
);

// GET /api/dashboard - Get dashboard data (generic)
router.get(
  '/',
  validateRequest({ query: dashboardDataSchema }),
  dashboardController.getDashboardData.bind(dashboardController)
);

router.get(
  '/widgets/:widgetType',
  validateRequest({ query: dashboardDataSchema }),
  dashboardController.getWidgetData.bind(dashboardController)
);

router.post(
  '/refresh',
  dashboardController.refreshDashboard.bind(dashboardController)
);

router.get(
  '/stats',
  dashboardController.getDashboardStats.bind(dashboardController)
);

export default router;
