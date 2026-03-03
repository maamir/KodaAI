import { config } from '../../config';
import { logger } from '../../infrastructure/logger';

export interface JiraCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface GitHubCredentials {
  token: string;
  appId?: string;
  privateKey?: string;
}

export class CredentialManager {
  private static instance: CredentialManager;

  private constructor() {}

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * Get Jira credentials from environment
   */
  getJiraCredentials(): JiraCredentials | null {
    const baseUrl = config.integrations.jira.baseUrl;
    const email = config.integrations.jira.email;
    const apiToken = config.integrations.jira.apiToken;

    if (!baseUrl || !email || !apiToken) {
      logger.warn('Jira credentials not configured');
      return null;
    }

    return { baseUrl, email, apiToken };
  }

  /**
   * Get GitHub credentials from environment
   */
  getGitHubCredentials(): GitHubCredentials | null {
    const token = config.integrations.github.token;
    const appId = config.integrations.github.appId;
    const privateKey = config.integrations.github.privateKey;

    if (!token) {
      logger.warn('GitHub credentials not configured');
      return null;
    }

    return { token, appId, privateKey };
  }

  /**
   * Validate Jira credentials are present
   */
  validateJiraCredentials(): boolean {
    const credentials = this.getJiraCredentials();
    if (!credentials) {
      logger.error('Jira credentials validation failed: missing credentials');
      return false;
    }

    if (!credentials.baseUrl.startsWith('https://')) {
      logger.error('Jira credentials validation failed: baseUrl must use HTTPS');
      return false;
    }

    if (!credentials.email.includes('@')) {
      logger.error('Jira credentials validation failed: invalid email format');
      return false;
    }

    if (credentials.apiToken.length < 10) {
      logger.error('Jira credentials validation failed: apiToken too short');
      return false;
    }

    logger.info('Jira credentials validated successfully');
    return true;
  }

  /**
   * Validate GitHub credentials are present
   */
  validateGitHubCredentials(): boolean {
    const credentials = this.getGitHubCredentials();
    if (!credentials) {
      logger.error('GitHub credentials validation failed: missing credentials');
      return false;
    }

    if (credentials.token.length < 10) {
      logger.error('GitHub credentials validation failed: token too short');
      return false;
    }

    // If using GitHub App, validate app credentials
    if (credentials.appId && !credentials.privateKey) {
      logger.error('GitHub credentials validation failed: appId provided but privateKey missing');
      return false;
    }

    logger.info('GitHub credentials validated successfully');
    return true;
  }

  /**
   * Validate all integration credentials on startup
   */
  validateAllCredentials(): { jira: boolean; github: boolean } {
    const jiraValid = this.validateJiraCredentials();
    const githubValid = this.validateGitHubCredentials();

    if (!jiraValid || !githubValid) {
      logger.warn('Some integration credentials are invalid or missing', {
        jira: jiraValid,
        github: githubValid,
      });
    } else {
      logger.info('All integration credentials validated successfully');
    }

    return { jira: jiraValid, github: githubValid };
  }

  /**
   * Redact sensitive credential data for logging
   */
  redactCredential(credential: string): string {
    if (!credential || credential.length < 8) {
      return '***';
    }
    return `${credential.substring(0, 4)}...${credential.substring(credential.length - 4)}`;
  }

  /**
   * Redact email for logging
   */
  redactEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***.***';
    }
    const [username, domain] = email.split('@');
    const redactedUsername = username.length > 2 
      ? `${username.substring(0, 2)}***` 
      : '***';
    return `${redactedUsername}@${domain}`;
  }

  /**
   * Get safe credential info for logging (redacted)
   */
  getSafeJiraInfo(): { baseUrl: string; email: string } | null {
    const credentials = this.getJiraCredentials();
    if (!credentials) {
      return null;
    }

    return {
      baseUrl: credentials.baseUrl,
      email: this.redactEmail(credentials.email),
    };
  }

  /**
   * Get safe credential info for logging (redacted)
   */
  getSafeGitHubInfo(): { hasToken: boolean; hasAppCredentials: boolean } | null {
    const credentials = this.getGitHubCredentials();
    if (!credentials) {
      return null;
    }

    return {
      hasToken: !!credentials.token,
      hasAppCredentials: !!(credentials.appId && credentials.privateKey),
    };
  }
}

// Export singleton instance
export const credentialManager = CredentialManager.getInstance();
