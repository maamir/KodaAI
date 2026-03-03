import { Router } from 'express';
import { featuresController } from '../controllers/features.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { startTrackingSchema, transitionPhaseSchema, featureQuerySchema } from '../types/schemas';

const router = Router();

router.post(
  '/start',
  validateRequest({ body: startTrackingSchema }),
  featuresController.startTracking.bind(featuresController)
);

router.get(
  '/',
  validateRequest({ query: featureQuerySchema }),
  featuresController.listFeatures.bind(featuresController)
);

router.get(
  '/:id',
  featuresController.getFeature.bind(featuresController)
);

router.post(
  '/:id/transition',
  validateRequest({ body: transitionPhaseSchema }),
  featuresController.transitionPhase.bind(featuresController)
);

router.post(
  '/:id/pause',
  featuresController.pauseTracking.bind(featuresController)
);

router.post(
  '/:id/resume',
  featuresController.resumeTracking.bind(featuresController)
);

router.post(
  '/:id/complete',
  featuresController.completeFeature.bind(featuresController)
);

export default router;
