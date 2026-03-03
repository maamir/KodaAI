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
  
  // Unit 3: Reporting and Visualization Configuration
  // AWS S3 Configuration
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Report Configuration
  REPORT_EXPIRATION_DAYS: z.coerce.number().int().positive().default(30),
  SIGNED_URL_EXPIRATION_DAYS: z.coerce.number().int().positive().default(7),
  MAX_REPORT_SIZE_MB: z.coerce.number().int().positive().default(50),
  MAX_FEATURES_PER_REPORT: z.coerce.number().int().positive().default(1000),
  REPORT_TIMEOUT_MS: z.coerce.number().int().positive().default(300000), // 5 minutes
  
  // Metric Calculation Configuration
  METRIC_CALCULATION_BATCH_SIZE: z.coerce.number().int().positive().default(10),
  METRIC_CALCULATION_TIMEOUT_MS: z.coerce.number().int().positive().default(30000), // 30 seconds
  DEFAULT_HOURLY_RATE: z.coerce.number().positive().default(150),
  
  // Dashboard Configuration
  DASHBOARD_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(30),
  DASHBOARD_MAX_WIDGETS: z.coerce.number().int().positive().default(12),
  DASHBOARD_MAX_DATA_POINTS: z.coerce.number().int().positive().default(1000),
  
  // Analytics Configuration
  ANALYTICS_API_KEY: z.string().optional(),
  ANALYTICS_ENABLED: z.coerce.boolean().default(false),
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

  validateReportingCredentials(): void {
    const errors: string[] = [];

    // Validate S3 credentials if report generation is enabled
    const hasS3Config = this.config.S3_BUCKET_NAME || this.config.AWS_ACCESS_KEY_ID || this.config.AWS_SECRET_ACCESS_KEY;
    if (hasS3Config) {
      if (!this.config.S3_BUCKET_NAME) errors.push('S3_BUCKET_NAME is required when S3 is configured');
      if (!this.config.AWS_ACCESS_KEY_ID) errors.push('AWS_ACCESS_KEY_ID is required when S3 is configured');
      if (!this.config.AWS_SECRET_ACCESS_KEY) errors.push('AWS_SECRET_ACCESS_KEY is required when S3 is configured');
    }

    if (errors.length > 0) {
      console.error('Reporting credentials validation failed:');
      errors.forEach((err) => console.error(`  - ${err}`));
      throw new Error('Invalid reporting credentials configuration');
    }
  }
}

export const config = new ConfigurationManager();
