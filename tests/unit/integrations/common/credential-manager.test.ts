import { CredentialManager } from '../../../../src/integrations/common/credential-manager';

describe('CredentialManager', () => {
  let credentialManager: CredentialManager;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('initialize', () => {
    it('should load credentials from environment variables', () => {
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'test-token';
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      process.env.GITHUB_TOKEN = 'ghp_test';

      credentialManager = new CredentialManager();
      credentialManager.initialize();

      expect(credentialManager.get('JIRA_EMAIL')).toBe('test@example.com');
      expect(credentialManager.get('JIRA_API_TOKEN')).toBe('test-token');
      expect(credentialManager.get('GITHUB_TOKEN')).toBe('ghp_test');
    });

    it('should throw error if required credentials missing', () => {
      process.env.JIRA_EMAIL = 'test@example.com';
      // Missing JIRA_API_TOKEN

      credentialManager = new CredentialManager();

      expect(() => credentialManager.initialize()).toThrow('Missing required credential');
    });

    it('should validate all required Jira credentials', () => {
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'token';
      // Missing JIRA_BASE_URL

      credentialManager = new CredentialManager();

      expect(() => credentialManager.initialize()).toThrow();
    });

    it('should validate all required GitHub credentials', () => {
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'token';
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      // Missing GITHUB_TOKEN

      credentialManager = new CredentialManager();

      expect(() => credentialManager.initialize()).toThrow();
    });
  });

  describe('get', () => {
    beforeEach(() => {
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'test-token';
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      process.env.GITHUB_TOKEN = 'ghp_test';

      credentialManager = new CredentialManager();
      credentialManager.initialize();
    });

    it('should return credential value', () => {
      expect(credentialManager.get('JIRA_EMAIL')).toBe('test@example.com');
    });

    it('should return empty string for non-existent credential', () => {
      expect(credentialManager.get('NON_EXISTENT')).toBe('');
    });

    it('should not expose credentials in error messages', () => {
      try {
        credentialManager.get('INVALID_KEY');
      } catch (error: any) {
        expect(error.message).not.toContain('test-token');
        expect(error.message).not.toContain('ghp_test');
      }
    });
  });

  describe('has', () => {
    beforeEach(() => {
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'test-token';
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      process.env.GITHUB_TOKEN = 'ghp_test';

      credentialManager = new CredentialManager();
      credentialManager.initialize();
    });

    it('should return true for existing credential', () => {
      expect(credentialManager.has('JIRA_EMAIL')).toBe(true);
    });

    it('should return false for non-existent credential', () => {
      expect(credentialManager.has('NON_EXISTENT')).toBe(false);
    });
  });

  describe('security', () => {
    beforeEach(() => {
      process.env.JIRA_EMAIL = 'test@example.com';
      process.env.JIRA_API_TOKEN = 'secret-token-123';
      process.env.JIRA_BASE_URL = 'https://test.atlassian.net';
      process.env.GITHUB_TOKEN = 'ghp_secret_456';

      credentialManager = new CredentialManager();
      credentialManager.initialize();
    });

    it('should never log credentials', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      credentialManager.get('JIRA_API_TOKEN');
      
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('secret-token-123'));
      
      consoleSpy.mockRestore();
    });

    it('should not expose credentials in toString', () => {
      const str = credentialManager.toString();
      
      expect(str).not.toContain('secret-token-123');
      expect(str).not.toContain('ghp_secret_456');
    });
  });
});
