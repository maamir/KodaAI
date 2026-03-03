import { HookEventType } from '@prisma/client';
import { hookEventRepository } from '../repositories/hook-event.repository';
import { HookDataSummary } from '../types/entities';

export class DataAggregationService {
  /**
   * Aggregate hook data for a feature
   */
  async aggregateHookData(featureId: string): Promise<HookDataSummary> {
    const events = await hookEventRepository.findAllByFeatureId(featureId);

    const fileEdits = events.filter((e) => e.eventType === HookEventType.FILE_EDIT);
    const prompts = events.filter((e) => e.eventType === HookEventType.PROMPT_SUBMITTED);
    const agentExecutions = events.filter((e) => e.eventType === HookEventType.AGENT_EXECUTION);

    // Aggregate file edit data
    const uniqueFiles = new Set<string>();
    let totalLinesAdded = 0;
    let totalLinesDeleted = 0;

    for (const event of fileEdits) {
      const data = event.eventData as any;
      uniqueFiles.add(data.filePath);
      totalLinesAdded += data.linesAdded || 0;
      totalLinesDeleted += data.linesDeleted || 0;
    }

    // Aggregate agent execution data
    let totalAgentTimeSeconds = 0;
    for (const event of agentExecutions) {
      const data = event.eventData as any;
      totalAgentTimeSeconds += data.durationSeconds || 0;
    }

    const averageAgentTimeSeconds =
      agentExecutions.length > 0 ? totalAgentTimeSeconds / agentExecutions.length : 0;

    return {
      totalFileEdits: fileEdits.length,
      uniqueFiles: uniqueFiles.size,
      totalLinesAdded,
      totalLinesDeleted,
      netLinesChanged: totalLinesAdded - totalLinesDeleted,
      totalPrompts: prompts.length,
      totalAgentExecutions: agentExecutions.length,
      totalAgentTimeSeconds,
      averageAgentTimeSeconds,
    };
  }

  /**
   * Calculate efficiency metrics
   */
  async calculateEfficiencyMetrics(featureId: string, estimatedHours?: number) {
    const hookData = await this.aggregateHookData(featureId);

    // Convert agent time to hours
    const aiTimeHours = hookData.totalAgentTimeSeconds / 3600;

    // Calculate metrics
    const metrics = {
      aiTimeHours,
      estimatedHours: estimatedHours || 0,
      timeSaved: estimatedHours ? estimatedHours - aiTimeHours : 0,
      speedMultiplier: estimatedHours && aiTimeHours > 0 ? estimatedHours / aiTimeHours : 0,
      linesOfCode: hookData.netLinesChanged,
      filesModified: hookData.uniqueFiles,
      promptsUsed: hookData.totalPrompts,
    };

    return metrics;
  }
}

export const dataAggregationService = new DataAggregationService();
