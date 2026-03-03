import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3000),
  WEBSOCKET_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url(),
  ENCRYPTION_KEY: z.string().length(64),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  DASHBOARD_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  
  // Unit 2: Integration Module Configuration
  WORKER_MODE: z.coerce.boolean().default(false),
  
  // Jira Configuration
  JIRA_EMAIL: z.string().email().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JIRA_BASE_URL: z.string().url().optional(),
  
  // GitHub Configuration
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
  GITHUB_INSTALLATION_ID: z.string().optional(),
  
  // Integration Configuration
  INTEGRATION_CACHE_TTL: z.coerce.number().int().positive().default(900), // 15 minutes
  INTEGRATION_JOB_POLL_INTERVAL: z.coerce.number().int().positive().default(5000), // 5 seconds
  INTEGRATION_MAX_RETRIES: z.coerce.number().int().nonnegative().default(3),
  INTEGRATION_RATE_LIMIT_THRESHOLD: z.coerce.number().min(0).max(1).default(0.2), // 20%
});

class ConfigurationManager {
  private config: z.infer<typeof configSchema>;

  constructor() {
    try {
      this.config = configSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:');
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
      }
      throw error;
    }
  }

  get<K extends keyof z.infer<typeof configSchema>>(
    key: K
  ): z.infer<typeof configSchema>[K] {
    return this.config[key];
  }

  getAll(): z.infer<typeof configSchema> {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }

  isWorkerMode(): boolean {
    return this.config.WORKER_MODE;
  }

  validateIntegrationCredentials(): void {
    const errors: string[] = [];

    // Validate Jira credentials if any are provided
    const hasJiraConfig = this.config.JIRA_EMAIL || this.config.JIRA_API_TOKEN || this.config.JIRA_BASE_URL;
    if (hasJiraConfig) {
      if (!this.config.JIRA_EMAIL) errors.push('JIRA_EMAIL is required when Jira integration is configured');
      if (!this.config.JIRA_API_TOKEN) errors.push('JIRA_API_TOKEN is required when Jira integration is configured');
      if (!this.config.JIRA_BASE_URL) errors.push('JIRA_BASE_URL is required when Jira integration is configured');
    }

    // Validate GitHub credentials if any are provided
    const hasGitHubConfig = this.config.GITHUB_APP_ID || this.config.GITHUB_APP_PRIVATE_KEY || this.config.GITHUB_INSTALLATION_ID;
    if (hasGitHubConfig) {
      if (!this.config.GITHUB_APP_ID) errors.push('GITHUB_APP_ID is required when GitHub integration is configured');
      if (!this.config.GITHUB_APP_PRIVATE_KEY) errors.push('GITHUB_APP_PRIVATE_KEY is required when GitHub integration is configured');
      if (!this.config.GITHUB_INSTALLATION_ID) errors.push('GITHUB_INSTALLATION_ID is required when GitHub integration is configured');
    }

    if (errors.length > 0) {
      console.error('Integration credentials validation failed:');
      errors.forEach((err) => console.error(`  - ${err}`));
      throw new Error('Invalid integration credentials configuration');
    }
  }
}

export const config = new ConfigurationManager();
