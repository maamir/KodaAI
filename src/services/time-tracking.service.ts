import { Feature, TimeTracking, FeatureStatus, Phase } from '@prisma/client';
import { featureRepository } from '../repositories/feature.repository';
import { timeTrackingRepository } from '../repositories/time-tracking.repository';
import { BusinessRuleError, NotFoundError, ConflictError } from '../infrastructure/errors';
import { featureIdentificationService } from './feature-identification.service';
import { FeatureSummary } from '../types/entities';
import { logger } from '../infrastructure/logger';

export class TimeTrackingService {
  /**
   * Start tracking a feature
   */
  async startFeatureTracking(
    featureId: string,
    name?: string,
    estimatedHours?: number
  ): Promise<Feature> {
    // Validate feature ID format
    featureIdentificationService.validateFeatureId(featureId);

    // Check for existing active tracking
    const existingFeature = await featureRepository.findByFeatureId(featureId);
    if (existingFeature && existingFeature.status === FeatureStatus.IN_PROGRESS) {
      throw new ConflictError('Feature already being tracked');
    }

    // Create feature
    const feature = await featureRepository.create({
      featureId,
      name: name || featureId,
      status: FeatureStatus.IN_PROGRESS,
      currentPhase: Phase.INCEPTION,
      startedAt: new Date(),
      estimatedHours,
    });

    // Create initial time tracking
    await timeTrackingRepository.create({
      feature: { connect: { id: feature.id } },
      phase: Phase.INCEPTION,
      startTime: new Date(),
    });

    logger.info('Feature tracking started', {
      featureId: feature.featureId,
      id: feature.id,
    });

    return feature;
  }

  /**
   * Transition to next phase
   */
  async transitionPhase(featureId: string, newPhase: Phase): Promise<Feature> {
    const feature = await featureRepository.findById(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    if (feature.status !== FeatureStatus.IN_PROGRESS) {
      throw new BusinessRuleError('Feature not in progress');
    }

    // Validate transition
    if (!this.isValidTransition(feature.currentPhase, newPhase)) {
      throw new BusinessRuleError(
        `Cannot transition from ${feature.currentPhase} to ${newPhase}`
      );
    }

    // End current phase tracking
    const currentTracking = await timeTrackingRepository.findActiveByFeatureId(featureId);
    if (currentTracking) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - currentTracking.startTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      await timeTrackingRepository.update(currentTracking.id, {
        endTime,
        durationMinutes,
      });
    }

    // Update feature phase
    const updatedFeature = await featureRepository.update(featureId, {
      currentPhase: newPhase,
    });

    // Start new phase tracking
    await timeTrackingRepository.create({
      feature: { connect: { id: featureId } },
      phase: newPhase,
      startTime: new Date(),
    });

    logger.info('Phase transitioned', {
      featureId: feature.featureId,
      oldPhase: feature.currentPhase,
      newPhase,
    });

    return updatedFeature;
  }

  /**
   * Pause tracking
   */
  async pauseTracking(featureId: string): Promise<TimeTracking> {
    const tracking = await timeTrackingRepository.findActiveByFeatureId(featureId);
    if (!tracking) {
      throw new NotFoundError('No active tracking found');
    }

    if (tracking.isPaused) {
      throw new BusinessRuleError('Tracking already paused');
    }

    const updated = await timeTrackingRepository.update(tracking.id, {
      isPaused: true,
      pausedAt: new Date(),
    });

    logger.info('Tracking paused', { featureId, trackingId: tracking.id });

    return updated;
  }

  /**
   * Resume tracking
   */
  async resumeTracking(featureId: string): Promise<TimeTracking> {
    const tracking = await timeTrackingRepository.findActiveByFeatureId(featureId);
    if (!tracking) {
      throw new NotFoundError('No active tracking found');
    }

    if (!tracking.isPaused) {
      throw new BusinessRuleError('Tracking not paused');
    }

    const updated = await timeTrackingRepository.update(tracking.id, {
      isPaused: false,
      pausedAt: null,
    });

    logger.info('Tracking resumed', { featureId, trackingId: tracking.id });

    return updated;
  }

  /**
   * Complete feature
   */
  async completeFeature(featureId: string): Promise<Feature> {
    const feature = await featureRepository.findById(featureId);
    if (!feature) {
      throw new NotFoundError('Feature not found');
    }

    if (feature.status !== FeatureStatus.IN_PROGRESS) {
      throw new BusinessRuleError('Feature not in progress');
    }

    // End active tracking
    const activeTracking = await timeTrackingRepository.findActiveByFeatureId(featureId);
    if (activeTracking) {
      const endTime = new Date();
      const durationMs = endTime.getTime() - activeTracking.startTime.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      await timeTrackingRepository.update(activeTracking.id, {
        endTime,
        durationMinutes,
      });
    }

    // Update feature
    const updatedFeature = await featureRepository.update(featureId, {
      status: FeatureStatus.COMPLETED,
      completedAt: new Date(),
    });

    logger.info('Feature completed', {
      featureId: feature.featureId,
      id: featureId,
    });

    return updatedFeature;
  }

  /**
   * Calculate feature summary
   */
  async calculateFeatureSummary(featureId: string): Promise<FeatureSummary> {
    const timeRecords = await timeTrackingRepository.findAllByFeatureId(featureId);

    const summary: FeatureSummary = {
      totalMinutes: 0,
      inceptionMinutes: 0,
      constructionMinutes: 0,
      testingMinutes: 0,
    };

    for (const record of timeRecords) {
      summary.totalMinutes += record.durationMinutes;

      switch (record.phase) {
        case Phase.INCEPTION:
          summary.inceptionMinutes += record.durationMinutes;
          break;
        case Phase.CONSTRUCTION:
          summary.constructionMinutes += record.durationMinutes;
          break;
        case Phase.TESTING:
          summary.testingMinutes += record.durationMinutes;
          break;
      }
    }

    return summary;
  }

  /**
   * Validate phase transition
   */
  private isValidTransition(from: Phase, to: Phase): boolean {
    const validTransitions: Record<Phase, Phase[]> = {
      [Phase.INCEPTION]: [Phase.CONSTRUCTION],
      [Phase.CONSTRUCTION]: [Phase.TESTING],
      [Phase.TESTING]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}

export const timeTrackingService = new TimeTrackingService();
