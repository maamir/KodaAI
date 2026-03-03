import { MetricType } from '@prisma/client';
import { calculatedMetricRepository } from '../repositories/calculated-metric.repository';
import { featureRepository } from '../repositories/feature.repository';
import { MetricCalculationResult } from '../types/entities';
import { logger } from '../infrastructure/logger';

export class MetricCalculationService {
  private readonly DEFAULT_HOURLY_RATE = 150;
  private readonly DEFAULT_TOOL_COST = 100;

  async calculateMetric(
    featureId: string,
    metricType: MetricType,
    parameters: Record<string, any> = {}
  ): Promise<MetricCalculationResult> {
    try {
      const feature = await featureRepository.findById(featureId);
      if (!feature) {
        throw new Error(`Feature not found: ${featureId}`);
      }

      let result: MetricCalculationResult;

      switch (metricType) {
        case MetricType.TIME_SAVED:
          result = await this.calculateTimeSaved(feature, parameters);
          break;
        case MetricType.SPEED_MULTIPLIER:
          result = await this.calculateSpeedMultiplier(feature, parameters);
          break;
        case MetricType.COST_SAVINGS:
          result = await this.calculateCostSavings(feature, parameters);
          break;
        case MetricType.PRODUCTIVITY_GAIN:
          result = await this.calculateProductivityGain(feature, parameters);
          break;
        case MetricType.QUALITY_SCORE:
          result = await this.calculateQualityScore(feature, parameters);
          break;
        case MetricType.VELOCITY:
          result = await this.calculateVelocity(feature, parameters);
          break;
        case MetricType.CYCLE_TIME:
          result = await this.calculateCycleTime(feature, parameters);
          break;
        case MetricType.LEAD_TIME:
          result = await this.calculateLeadTime(feature, parameters);
          break;
        case MetricType.THROUGHPUT:
          result = await this.calculateThroughput(feature, parameters);
          break;
        case MetricType.DEFECT_RATE:
          result = await this.calculateDefectRate(feature, parameters);
          break;
        default:
          throw new Error(`Unknown metric type: ${metricType}`);
      }

      // Store the calculated metric
      await this.storeMetric(featureId, metricType, result);

      return result;
    } catch (error) {
      logger.error(`Error calculating metric ${metricType} for feature ${featureId}:`, error);
      throw error;
    }
  }

  async calculateMultipleMetrics(
    featureId: string,
    metricTypes: MetricType[],
    parameters: Record<string, any> = {}
  ): Promise<MetricCalculationResult[]> {
    const results: MetricCalculationResult[] = [];

    for (const metricType of metricTypes) {
      try {
        const result = await this.calculateMetric(featureId, metricType, parameters);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to calculate ${metricType}:`, error);
        // Continue with other metrics
      }
    }

    return results;
  }

  private async calculateTimeSaved(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const totalActualMinutes = feature.timeTracking?.reduce(
      (sum: number, t: any) => sum + t.durationMinutes,
      0
    ) || 0;
    const totalActualHours = totalActualMinutes / 60;

    let totalEstimateHours = 0;
    if (feature.estimate) {
      totalEstimateHours = feature.estimate.totalHours || 0;
    } else if (feature.jiraStory?.originalEstimate) {
      totalEstimateHours = feature.jiraStory.originalEstimate / 3600;
    } else if (parameters.estimatedHours) {
      totalEstimateHours = parameters.estimatedHours;
    }

    const timeSaved = totalEstimateHours - totalActualHours;

    return {
      metricType: MetricType.TIME_SAVED,
      metricValue: timeSaved,
      formula: 'estimate - actual',
      parameters: {
        estimatedHours: totalEstimateHours,
        actualHours: totalActualHours,
      },
    };
  }

  private async calculateSpeedMultiplier(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const totalActualMinutes = feature.timeTracking?.reduce(
      (sum: number, t: any) => sum + t.durationMinutes,
      0
    ) || 0;
    const totalActualHours = totalActualMinutes / 60;

    let totalEstimateHours = 0;
    if (feature.estimate) {
      totalEstimateHours = feature.estimate.totalHours || 0;
    } else if (feature.jiraStory?.originalEstimate) {
      totalEstimateHours = feature.jiraStory.originalEstimate / 3600;
    } else if (parameters.estimatedHours) {
      totalEstimateHours = parameters.estimatedHours;
    }

    if (totalActualHours === 0) {
      return {
        metricType: MetricType.SPEED_MULTIPLIER,
        metricValue: 0,
        formula: 'estimate / actual',
        parameters: { error: 'Division by zero' },
      };
    }

    const speedMultiplier = totalEstimateHours / totalActualHours;

    return {
      metricType: MetricType.SPEED_MULTIPLIER,
      metricValue: speedMultiplier,
      formula: 'estimate / actual',
      parameters: {
        estimatedHours: totalEstimateHours,
        actualHours: totalActualHours,
      },
    };
  }

  private async calculateCostSavings(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const timeSavedResult = await this.calculateTimeSaved(feature, parameters);
    const hourlyRate = parameters.hourlyRate || this.DEFAULT_HOURLY_RATE;
    const costSavings = timeSavedResult.metricValue * hourlyRate;

    return {
      metricType: MetricType.COST_SAVINGS,
      metricValue: costSavings,
      formula: 'timeSaved * hourlyRate',
      parameters: {
        timeSaved: timeSavedResult.metricValue,
        hourlyRate,
      },
    };
  }

  private async calculateProductivityGain(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const speedMultiplierResult = await this.calculateSpeedMultiplier(feature, parameters);
    const productivityGain = (speedMultiplierResult.metricValue - 1) * 100;

    return {
      metricType: MetricType.PRODUCTIVITY_GAIN,
      metricValue: productivityGain,
      formula: '(speedMultiplier - 1) * 100',
      parameters: {
        speedMultiplier: speedMultiplierResult.metricValue,
      },
    };
  }

  private async calculateQualityScore(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    // Quality score based on multiple factors
    let score = 0;
    const factors: string[] = [];

    // Factor 1: Code review coverage (PRs)
    if (feature.githubPRs && feature.githubPRs.length > 0) {
      const reviewedPRs = feature.githubPRs.filter((pr: any) => pr.reviewCount > 0).length;
      const reviewCoverage = (reviewedPRs / feature.githubPRs.length) * 30;
      score += reviewCoverage;
      factors.push(`reviewCoverage: ${reviewCoverage.toFixed(2)}`);
    }

    // Factor 2: Test coverage (from parameters or default)
    const testCoverage = parameters.testCoverage || 0;
    score += testCoverage * 0.4; // Max 40 points
    factors.push(`testCoverage: ${(testCoverage * 0.4).toFixed(2)}`);

    // Factor 3: Documentation (from parameters)
    const hasDocumentation = parameters.hasDocumentation || false;
    if (hasDocumentation) {
      score += 15;
      factors.push('documentation: 15');
    }

    // Factor 4: Defect rate (inverse)
    const defectRate = parameters.defectRate || 0;
    const defectScore = Math.max(0, 15 - defectRate * 5);
    score += defectScore;
    factors.push(`defectScore: ${defectScore.toFixed(2)}`);

    return {
      metricType: MetricType.QUALITY_SCORE,
      metricValue: Math.min(100, score),
      formula: 'reviewCoverage + testCoverage + documentation + defectScore',
      parameters: {
        factors,
        testCoverage,
        hasDocumentation,
        defectRate,
      },
    };
  }

  private async calculateVelocity(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const storyPoints = feature.jiraStory?.storyPoints || parameters.storyPoints || 0;
    const totalActualMinutes = feature.timeTracking?.reduce(
      (sum: number, t: any) => sum + t.durationMinutes,
      0
    ) || 0;
    const totalActualHours = totalActualMinutes / 60;

    if (totalActualHours === 0) {
      return {
        metricType: MetricType.VELOCITY,
        metricValue: 0,
        formula: 'storyPoints / hours',
        parameters: { error: 'Division by zero' },
      };
    }

    const velocity = storyPoints / totalActualHours;

    return {
      metricType: MetricType.VELOCITY,
      metricValue: velocity,
      formula: 'storyPoints / hours',
      parameters: {
        storyPoints,
        actualHours: totalActualHours,
      },
    };
  }

  private async calculateCycleTime(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    if (!feature.startedAt || !feature.completedAt) {
      return {
        metricType: MetricType.CYCLE_TIME,
        metricValue: 0,
        formula: 'completedAt - startedAt',
        parameters: { error: 'Feature not completed' },
      };
    }

    const cycleTimeMs = feature.completedAt.getTime() - feature.startedAt.getTime();
    const cycleTimeHours = cycleTimeMs / (1000 * 60 * 60);

    return {
      metricType: MetricType.CYCLE_TIME,
      metricValue: cycleTimeHours,
      formula: 'completedAt - startedAt',
      parameters: {
        startedAt: feature.startedAt,
        completedAt: feature.completedAt,
      },
    };
  }

  private async calculateLeadTime(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    if (!feature.createdAt || !feature.completedAt) {
      return {
        metricType: MetricType.LEAD_TIME,
        metricValue: 0,
        formula: 'completedAt - createdAt',
        parameters: { error: 'Feature not completed' },
      };
    }

    const leadTimeMs = feature.completedAt.getTime() - feature.createdAt.getTime();
    const leadTimeHours = leadTimeMs / (1000 * 60 * 60);

    return {
      metricType: MetricType.LEAD_TIME,
      metricValue: leadTimeHours,
      formula: 'completedAt - createdAt',
      parameters: {
        createdAt: feature.createdAt,
        completedAt: feature.completedAt,
      },
    };
  }

  private async calculateThroughput(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const totalCommits = feature.githubCommits?.length || 0;
    const totalPRs = feature.githubPRs?.length || 0;
    const totalActualMinutes = feature.timeTracking?.reduce(
      (sum: number, t: any) => sum + t.durationMinutes,
      0
    ) || 0;
    const totalActualHours = totalActualMinutes / 60;

    if (totalActualHours === 0) {
      return {
        metricType: MetricType.THROUGHPUT,
        metricValue: 0,
        formula: '(commits + PRs) / hours',
        parameters: { error: 'Division by zero' },
      };
    }

    const throughput = (totalCommits + totalPRs) / totalActualHours;

    return {
      metricType: MetricType.THROUGHPUT,
      metricValue: throughput,
      formula: '(commits + PRs) / hours',
      parameters: {
        commits: totalCommits,
        pullRequests: totalPRs,
        actualHours: totalActualHours,
      },
    };
  }

  private async calculateDefectRate(
    feature: any,
    parameters: Record<string, any>
  ): Promise<MetricCalculationResult> {
    const totalDefects = parameters.defectCount || 0;
    const totalCommits = feature.githubCommits?.length || 1; // Avoid division by zero

    const defectRate = (totalDefects / totalCommits) * 100;

    return {
      metricType: MetricType.DEFECT_RATE,
      metricValue: defectRate,
      formula: '(defects / commits) * 100',
      parameters: {
        defectCount: totalDefects,
        commits: totalCommits,
      },
    };
  }

  private async storeMetric(
    featureId: string,
    metricType: MetricType,
    result: MetricCalculationResult
  ): Promise<void> {
    const existing = await calculatedMetricRepository.findByFeatureAndType(featureId, metricType);

    if (existing) {
      await calculatedMetricRepository.update(existing.id, {
        metricValue: result.metricValue,
        formula: result.formula,
        parameters: result.parameters,
        calculatedAt: new Date(),
      });
    } else {
      await calculatedMetricRepository.create({
        feature: { connect: { id: featureId } },
        metricType,
        metricValue: result.metricValue,
        formula: result.formula,
        parameters: result.parameters,
      });
    }
  }

  async recalculateAllMetrics(featureId: string): Promise<MetricCalculationResult[]> {
    const allMetricTypes = Object.values(MetricType);
    return this.calculateMultipleMetrics(featureId, allMetricTypes);
  }

  async getLatestMetric(featureId: string, metricType: MetricType) {
    return calculatedMetricRepository.findByFeatureAndType(featureId, metricType);
  }

  async getValidMetrics(featureId: string) {
    return calculatedMetricRepository.findValidMetrics(featureId);
  }
}

export const metricCalculationService = new MetricCalculationService();
