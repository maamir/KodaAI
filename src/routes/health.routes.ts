import { Router, Request, Response } from 'express';
import { prisma } from '../infrastructure/database';

const router = Router();

const startTime = Date.now();

router.get('/', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: (Date.now() - startTime) / 1000,
    checks: {
      application: 'ok',
      database: 'unknown' as 'ok' | 'error',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch (error) {
    res.status(503).json({ ready: false });
  }
});

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});

export default router;
