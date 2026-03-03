import { Router } from 'express';
import { dashboardConfigController } from '../controllers/dashboard-config.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { createDashboardViewSchema, updateDashboardViewSchema, dashboardViewQuerySchema } from '../types/schemas';

const router = Router();

router.post(
  '/views',
  validateRequest({ body: createDashboardViewSchema }),
  dashboardConfigController.createDashboardView.bind(dashboardConfigController)
);

router.get(
  '/views',
  validateRequest({ query: dashboardViewQuerySchema }),
  dashboardConfigController.getDashboardViews.bind(dashboardConfigController)
);

router.get(
  '/views/default',
  dashboardConfigController.getDefaultDashboardView.bind(dashboardConfigController)
);

router.get(
  '/views/:id',
  dashboardConfigController.getDashboardView.bind(dashboardConfigController)
);

router.put(
  '/views/:id',
  validateRequest({ body: updateDashboardViewSchema }),
  dashboardConfigController.updateDashboardView.bind(dashboardConfigController)
);

router.delete(
  '/views/:id',
  dashboardConfigController.deleteDashboardView.bind(dashboardConfigController)
);

router.post(
  '/views/:id/set-default',
  dashboardConfigController.setAsDefault.bind(dashboardConfigController)
);

router.post(
  '/views/:id/clone',
  dashboardConfigController.cloneDashboardView.bind(dashboardConfigController)
);

router.get(
  '/widget-types',
  dashboardConfigController.getAvailableWidgetTypes.bind(dashboardConfigController)
);

export default router;
