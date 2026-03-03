import { featureRepository } from '../repositories/feature.repository';
import { ValidationError } from '../infrastructure/errors';
import { logger } from '../infrastructure/logger';

export class FeatureIdentificationService {
  /**
   * Detect feature ID from branch name
   * Patterns: feature/PROJ-123-description or PROJ-123-description
   */
  detectFromBranch(branchName: string): string | null {
    const patterns = [
      /feature\/([A-Z]+-\d+)/,
      /^([A-Z]+-\d+)/,
    ];

    for (const pattern of patterns) {
      const match = branchName.match(pattern);
      if (match) {
        logger.debug('Feature ID detected from branch', {
          branchName,
          featureId: match[1],
        });
        return match[1];
      }
    }

    return null;
  }

  /**
   * Detect feature ID from commit message
   * Patterns: PROJ-123: description or [PROJ-123] description
   */
  detectFromCommit(commitMessage: string): string | null {
    const patterns = [
      /^([A-Z]+-\d+):/,
      /\[([A-Z]+-\d+)\]/,
    ];

    for (const pattern of patterns) {
      const match = commitMessage.match(pattern);
      if (match) {
        logger.debug('Feature ID detected from commit', {
          commitMessage,
          featureId: match[1],
        });
        return match[1];
      }
    }

    return null;
  }

  /**
   * Combined detection with priority: branch > commit > null
   */
  detectFeatureId(branchName: string, commitMessage?: string): string | null {
    // Priority 1: Branch name
    const fromBranch = this.detectFromBranch(branchName);
    if (fromBranch) {
      return fromBranch;
    }

    // Priority 2: Commit message
    if (commitMessage) {
      const fromCommit = this.detectFromCommit(commitMessage);
      if (fromCommit) {
        return fromCommit;
      }
    }

    // Priority 3: Return null (user must manually select)
    return null;
  }

  /**
   * Validate feature ID format
   */
  isValidFeatureId(featureId: string): boolean {
    return /^[A-Z]+-\d+$/.test(featureId);
  }

  /**
   * Validate feature ID and throw if invalid
   */
  validateFeatureId(featureId: string): void {
    if (!this.isValidFeatureId(featureId)) {
      throw new ValidationError('Invalid feature ID format (expected: PROJ-123)');
    }
  }

  /**
   * Check if feature exists
   */
  async featureExists(featureId: string): Promise<boolean> {
    const feature = await featureRepository.findByFeatureId(featureId);
    return feature !== null;
  }
}

export const featureIdentificationService = new FeatureIdentificationService();
