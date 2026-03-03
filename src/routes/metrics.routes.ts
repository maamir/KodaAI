import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { calculateMetricSchema, metricQuerySchema } from '../types/schemas';

const router = Router();

router.post(
  '/calculate',
  validateRequest({ body: calculateMetricSchema }),
  metricsController.calculateMetric.bind(metricsController)
);

router.post(
  '/calculate-batch',
  metricsController.calculateBatchMetrics.bind(metricsController)
);

router.get(
  '/',
  validateRequest({ query: metricQuerySchema }),
  metricsController.getMetrics.bind(metricsController)
);

router.get(
  '/feature/:featureId',
  metricsController.getFeatureMetrics.bind(metricsController)
);

router.get(
  '/feature/:featureId/:metricType',
  metricsController.getFeatureMetric.bind(metricsController)
);

router.get(
  '/trend/:featureId/:metricType',
  metricsController.getMetricTrend.bind(metricsController)
);

router.delete(
  '/:id',
  metricsController.deleteMetric.bind(metricsController)
);

export default router;
