import { PrismaClient, FeatureStatus, Phase } from '@prisma/client';
import { JiraClient } from '../integrations/jira/jira-client';
import { FeatureRepository } from '../repositories/feature.repository';
import { secureLogger } from '../integrations/common/secure-logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface JiraDetectionResult {
  success: boolean;
  jiraKey?: string;
  featureId?: string;
  featureName?: string;
  featureDescription?: string;
  error?: string;
}

export class JiraDetectionService {
  private jiraClient: JiraClient;
  private featureRepository: FeatureRepository;
  private jiraKeyPattern = /\b[A-Z]{2,10}-\d+\b/;
  private currentFeatureJsonPath: string;

  constructor(prisma: PrismaClient) {
    this.jiraClient = new JiraClient(prisma);
    this.featureRepository = new FeatureRepository();
    this.currentFeatureJsonPath = path.join(process.cwd(), '.kiro', 'current-feature.json');
  }

  /**
   * Extract first Jira key from message text
   */
  extractJiraKey(text: string): string | null {
    const match = text.match(this.jiraKeyPattern);
    return match ? match[0] : null;
  }

  /**
   * Validate Jira key format
   */
  validateJiraKeyFormat(jiraKey: string): boolean {
    return this.jiraKeyPattern.test(jiraKey);
  }

  /**
   * Check if text contains a Jira key
   */
  containsJiraKey(text: string): boolean {
    return this.jiraKeyPattern.test(text);
  }

  /**
   * Main orchestration method to detect Jira key and update feature tracking
   */
  async detectAndUpdateFeature(message: string): Promise<JiraDetectionResult> {
    try {
      // Extract Jira key from message
      const jiraKey = this.extractJiraKey(message);
      
      if (!jiraKey) {
        return {
          success: false,
          error: 'No Jira key found in message',
        };
      }

      secureLogger.info('Detected Jira key in message', { jiraKey });

      // Fetch ticket details from Jira API
      let jiraIssue;
      try {
        jiraIssue = await this.jiraClient.getIssue(jiraKey);
      } catch (error: any) {
        return this.handleJiraApiError(error, jiraKey);
      }

      // Create or find feature with Jira key as featureId
      let feature = await this.featureRepository.findByFeatureId(jiraKey);
      
      if (!feature) {
        secureLogger.info('Creating new feature for Jira ticket', { jiraKey });
        feature = await this.featureRepository.create({
          featureId: jiraKey,
          name: jiraIssue.fields.summary,
          status: FeatureStatus.IN_PROGRESS,
          currentPhase: Phase.INCEPTION,
          startedAt: new Date(),
        });
      } else {
        secureLogger.info('Found existing feature for Jira ticket', { jiraKey, featureDbId: feature.id });
      }

      // Update .kiro/current-feature.json
      const description = jiraIssue.fields.description || '';
      await this.updateCurrentFeatureJson(jiraKey, jiraIssue.fields.summary, description);

      secureLogger.info('Successfully updated feature tracking', {
        jiraKey,
        featureId: feature.id,
        featureName: jiraIssue.fields.summary,
      });

      return {
        success: true,
        jiraKey,
        featureId: feature.id,
        featureName: jiraIssue.fields.summary,
        featureDescription: description,
      };
    } catch (error: any) {
      secureLogger.error('Failed to detect and update feature', {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Update .kiro/current-feature.json with Jira key and ticket details
   */
  private async updateCurrentFeatureJson(
    jiraKey: string,
    name: string,
    description: string
  ): Promise<void> {
    const data = {
      featureId: jiraKey,
      name,
      description,
    };

    try {
      await fs.writeFile(
        this.currentFeatureJsonPath,
        JSON.stringify(data, null, 2) + '\n',
        'utf-8'
      );
      secureLogger.info('Updated current-feature.json', { jiraKey, name });
    } catch (error: any) {
      secureLogger.error('Failed to update current-feature.json', {
        error: error.message,
        path: this.currentFeatureJsonPath,
      });
      throw new Error(`Failed to update current-feature.json: ${error.message}`);
    }
  }

  /**
   * Handle Jira API errors with appropriate error messages
   */
  private handleJiraApiError(error: any, jiraKey: string): JiraDetectionResult {
    const statusCode = error.statusCode || error.status;

    if (statusCode === 404) {
      const errorMsg = `Jira ticket ${jiraKey} not found`;
      secureLogger.warn(errorMsg, { jiraKey });
      return {
        success: false,
        jiraKey,
        error: errorMsg,
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      const errorMsg = 'Jira authentication failed. Please check your credentials.';
      secureLogger.error(errorMsg, { jiraKey, statusCode });
      return {
        success: false,
        jiraKey,
        error: errorMsg,
      };
    }

    if (statusCode === 429) {
      const errorMsg = 'Jira API rate limit exceeded. Please try again later.';
      secureLogger.warn(errorMsg, { jiraKey });
      return {
        success: false,
        jiraKey,
        error: errorMsg,
      };
    }

    if (statusCode >= 500) {
      const errorMsg = `Jira server error (${statusCode}). Please try again later.`;
      secureLogger.error(errorMsg, { jiraKey, statusCode });
      return {
        success: false,
        jiraKey,
        error: errorMsg,
      };
    }

    // Network or other errors
    const errorMsg = error.message || 'Failed to fetch Jira ticket';
    secureLogger.error('Jira API error', {
      jiraKey,
      error: errorMsg,
      code: error.code,
    });

    return {
      success: false,
      jiraKey,
      error: errorMsg,
    };
  }
}
