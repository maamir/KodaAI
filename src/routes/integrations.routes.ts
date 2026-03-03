import { Router } from 'express';
import { integrationsController } from '../controllers/integrations.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  syncJiraSchema, 
  syncGitHubCommitsSchema, 
  syncGitHubPRsSchema,
  consistencyCheckSchema,
} from '../types/schemas';

const router = Router();

// Jira integration routes
router.post(
  '/jira/sync',
  validateRequest(syncJiraSchema),
  (req, res) => integrationsController.syncJira(req, res)
);

// GitHub integration routes
router.post(
  '/github/sync-commits',
  validateRequest(syncGitHubCommitsSchema),
  (req, res) => integrationsController.syncGitHubCommits(req, res)
);

router.post(
  '/github/sync-prs',
  validateRequest(syncGitHubPRsSchema),
  (req, res) => integrationsController.syncGitHubPRs(req, res)
);

// Job queue routes
router.get(
  '/jobs/:id',
  (req, res) => integrationsController.getJob(req, res)
);

router.get(
  '/queue/metrics',
  (req, res) => integrationsController.getQueueMetrics(req, res)
);

// Consistency check routes
router.post(
  '/consistency-check',
  validateRequest(consistencyCheckSchema),
  (req, res) => integrationsController.runConsistencyCheck(req, res)
);

export default router;
