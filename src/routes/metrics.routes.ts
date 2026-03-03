import { Router, Request, Response } from 'express';
import { getMetricsRegistry } from '../infrastructure/metrics';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.set('Content-Type', getMetricsRegistry().contentType);
  res.end(await getMetricsRegistry().metrics());
});

export default router;
