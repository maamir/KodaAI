import { FeatureIdentificationService } from '../../../src/services/feature-identification.service';

describe('FeatureIdentificationService', () => {
  let service: FeatureIdentificationService;

  beforeEach(() => {
    service = new FeatureIdentificationService();
  });

  describe('extractFeatureIdFromBranch', () => {
    it('should extract feature ID from branch name with prefix', () => {
      expect(service.extractFeatureIdFromBranch('feature/PROJ-123-add-login')).toBe('PROJ-123');
      expect(service.extractFeatureIdFromBranch('bugfix/JIRA-456-fix-crash')).toBe('JIRA-456');
    });

    it('should extract feature ID from branch name without prefix', () => {
      expect(service.extractFeatureIdFromBranch('PROJ-789-refactor')).toBe('PROJ-789');
    });

    it('should return null for invalid branch names', () => {
      expect(service.extractFeatureIdFromBranch('main')).toBeNull();
      expect(service.extractFeatureIdFromBranch('develop')).toBeNull();
      expect(service.extractFeatureIdFromBranch('random-branch')).toBeNull();
    });
  });

  describe('extractFeatureIdFromCommit', () => {
    it('should extract feature ID from commit message', () => {
      expect(service.extractFeatureIdFromCommit('[PROJ-123] Add login feature')).toBe('PROJ-123');
      expect(service.extractFeatureIdFromCommit('JIRA-456: Fix crash on startup')).toBe('JIRA-456');
      expect(service.extractFeatureIdFromCommit('Fix bug (TICKET-789)')).toBe('TICKET-789');
    });

    it('should return null for commit messages without feature ID', () => {
      expect(service.extractFeatureIdFromCommit('Fix typo')).toBeNull();
      expect(service.extractFeatureIdFromCommit('Update README')).toBeNull();
    });
  });

  describe('detectFeatureId', () => {
    it('should prioritize branch name over commit message', () => {
      const result = service.detectFeatureId(
        'feature/PROJ-123-login',
        '[PROJ-456] Different feature'
      );
      expect(result).toBe('PROJ-123');
    });

    it('should fall back to commit message if branch has no feature ID', () => {
      const result = service.detectFeatureId(
        'main',
        '[PROJ-789] Add feature'
      );
      expect(result).toBe('PROJ-789');
    });

    it('should return null if neither has feature ID', () => {
      const result = service.detectFeatureId('main', 'Fix typo');
      expect(result).toBeNull();
    });
  });

  describe('generateFeatureName', () => {
    it('should generate name from branch', () => {
      expect(service.generateFeatureName('feature/PROJ-123-add-login-page'))
        .toBe('Add Login Page');
    });

    it('should generate name from commit message', () => {
      expect(service.generateFeatureName(null, '[PROJ-123] Implement user authentication'))
        .toBe('Implement User Authentication');
    });

    it('should return default name if no context', () => {
      expect(service.generateFeatureName(null, null))
        .toBe('Unnamed Feature');
    });
  });
});
