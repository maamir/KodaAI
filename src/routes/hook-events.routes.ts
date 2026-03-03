import { Router } from 'express';
import { hookEventsController } from '../controllers/hook-events.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { createHookEventSchema } from '../types/schemas';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createHookEventSchema }),
  hookEventsController.createHookEvent.bind(hookEventsController)
);

router.get(
  '/:featureId',
  hookEventsController.getFeatureHookEvents.bind(hookEventsController)
);

router.get(
  '/',
  hookEventsController.getUnprocessedEvents.bind(hookEventsController)
);

export default router;
