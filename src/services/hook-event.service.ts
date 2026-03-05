import { HookEvent, HookEventType, PrismaClient, JobType } from '@prisma/client';
import { HookEventRepository } from '../repositories/hook-event.repository';
import { FeatureRepository } from '../repositories/feature.repository';
import { JobQueueManagerService } from './job-queue-manager.service';
import { logger } from '../infrastructure/logger';
import { NotFoundError } from '../infrastructure/errors';
import { JiraDetectionService } from './jira-detection.service';

interface FileEditEventData {
  filePath: string;
  operation: 'modified' | 'created' | 'deleted';
  linesAdded: number;
  linesDeleted: number;
}

interface PromptEventData {
  promptText: string;
  timestamp: string;
}

interface AgentExecutionEventData {
  startTime: string;
  endTime: string;
  durationSeconds: number;
}

export class HookEventService {
  private hookEventRepository: HookEventRepository;
  private featureRepository: FeatureRepository;
  private jobQueueManager: JobQueueManagerService;
  private jiraDetectionService: JiraDetectionService;

  constructor(private prisma: PrismaClient) {
    this.hookEventRepository = new HookEventRepository(prisma);
    this.featureRepository = new FeatureRepository(prisma);
    this.jobQueueManager = new JobQueueManagerService(prisma);
    this.jiraDetectionService = new JiraDetectionService(prisma);
  }

  /**
   * Process file edit event (async via job queue)
   */
  async processFileEditEvent(
    featureId: string,
    eventData: FileEditEventData,
    timestamp: Date = new Date()
  ): Promise<{ hookEventId: string; jobId: string }> {
    const feature = await this.featureRepository.findById(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Create hook event
    const hookEvent = await this.hookEventRepository.create({
      feature: { connect: { id: featureId } },
      eventType: HookEventType.FILE_EDIT,
      eventData: eventData as any,
      timestamp,
    });

    // Queue async processing job
    const jobId = await this.jobQueueManager.createJob({
      jobType: JobType.HOOK_EVENT_PROCESS,
      priority: 7,
      payload: {
        hookEventId: hookEvent.id,
        eventType: 'FILE_EDIT',
      },
    });

    logger.info('File edit event queued for async processing', {
      featureId,
      hookEventId: hookEvent.id,
      jobId,
      filePath: eventData.filePath,
    });

    return { hookEventId: hookEvent.id, jobId };
  }

  /**
   * Process prompt submitted event (async via job queue)
   */
  async processPromptEvent(
    featureId: string,
    eventData: PromptEventData,
    timestamp: Date = new Date()
  ): Promise<{ hookEventId: string; jobId: string }> {
    const feature = await this.featureRepository.findById(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Detect Jira key in prompt text and update feature tracking asynchronously
    // This runs in the background and doesn't block the hook event processing
    if (eventData.promptText) {
      this.detectAndUpdateJiraFeature(eventData.promptText).catch((error) => {
        logger.error('Failed to detect and update Jira feature', {
          error: error.message,
          promptText: eventData.promptText.substring(0, 100), // Log first 100 chars
        });
      });
    }

    // Create hook event
    const hookEvent = await this.hookEventRepository.create({
      feature: { connect: { id: featureId } },
      eventType: HookEventType.PROMPT_SUBMITTED,
      eventData: eventData as any,
      timestamp,
    });

    // Queue async processing job
    const jobId = await this.jobQueueManager.createJob({
      jobType: JobType.HOOK_EVENT_PROCESS,
      priority: 8,
      payload: {
        hookEventId: hookEvent.id,
        eventType: 'PROMPT_SUBMITTED',
      },
    });

    logger.info('Prompt event queued for async processing', {
      featureId,
      hookEventId: hookEvent.id,
      jobId,
    });

    return { hookEventId: hookEvent.id, jobId };
  }

  /**
   * Process agent execution event (async via job queue)
   */
  async processAgentExecutionEvent(
    featureId: string,
    eventData: AgentExecutionEventData,
    timestamp: Date = new Date()
  ): Promise<{ hookEventId: string; jobId: string }> {
    const feature = await this.featureRepository.findById(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    // Create hook event
    const hookEvent = await this.hookEventRepository.create({
      feature: { connect: { id: featureId } },
      eventType: HookEventType.AGENT_EXECUTION,
      eventData: eventData as any,
      timestamp,
    });

    // Queue async processing job
    const jobId = await this.jobQueueManager.createJob({
      jobType: JobType.HOOK_EVENT_PROCESS,
      priority: 6,
      payload: {
        hookEventId: hookEvent.id,
        eventType: 'AGENT_EXECUTION',
      },
    });

    logger.info('Agent execution event queued for async processing', {
      featureId,
      hookEventId: hookEvent.id,
      jobId,
      durationSeconds: eventData.durationSeconds,
    });

    return { hookEventId: hookEvent.id, jobId };
  }

  /**
   * Get all hook events for a feature
   */
  async getFeatureHookEvents(featureId: string): Promise<HookEvent[]> {
    return this.hookEventRepository.findAllByFeatureId(featureId);
  }

  /**
   * Mark hook event as processed
   */
  async markAsProcessed(eventId: string): Promise<HookEvent> {
    return this.hookEventRepository.markAsProcessed(eventId);
  }

  /**
   * Get unprocessed hook events
   */
  async getUnprocessedEvents(): Promise<HookEvent[]> {
    return this.hookEventRepository.findUnprocessed();
  }

  /**
   * Detect Jira key in message and update feature tracking
   * This method runs asynchronously and logs results
   */
  private async detectAndUpdateJiraFeature(message: string): Promise<void> {
    // Check if message contains a Jira key
    if (!this.jiraDetectionService.containsJiraKey(message)) {
      return;
    }

    const result = await this.jiraDetectionService.detectAndUpdateFeature(message);

    if (result.success) {
      logger.info('Detected Jira ticket and updated feature tracking', {
        jiraKey: result.jiraKey,
        featureName: result.featureName,
      });
    } else {
      logger.warn('Failed to update feature tracking for Jira ticket', {
        jiraKey: result.jiraKey,
        error: result.error,
      });
    }
  }
}

import { prisma } from '../infrastructure/database';

export const hookEventService = new HookEventService(prisma);
