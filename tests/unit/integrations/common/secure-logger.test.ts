import { SecureLogger } from '../../../../src/integrations/common/secure-logger';
import { logger } from '../../../../src/infrastructure/logger';

jest.mock('../../../../src/infrastructure/logger');

describe('SecureLogger', () => {
  let secureLogger: SecureLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    secureLogger = new SecureLogger('test-integration');
  });

  describe('info', () => {
    it('should log info message with redacted data', () => {
      const data = {
        apiToken: 'secret-token-123',
        email: 'user@example.com',
        message: 'Test message',
      };

      secureLogger.info('Test log', data);

      expect(logger.info).toHaveBeenCalledWith('Test log', {
        integration: 'test-integration',
        apiToken: '***REDACTED***',
        email: 'us***@example.com',
        message: 'Test message',
      });
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          email: 'test@example.com',
          password: 'secret123',
        },
        config: {
          apiKey: 'key-123',
        },
      };

      secureLogger.info('Nested data', data);

      expect(logger.info).toHaveBeenCalledWith('Nested data', {
        integration: 'test-integration',
        user: {
          email: 't***@example.com',
          password: '***REDACTED***',
        },
        config: {
          apiKey: '***REDACTED***',
        },
      });
    });

    it('should handle arrays', () => {
      const data = {
        tokens: ['token1', 'token2'],
        emails: ['user1@example.com', 'user2@example.com'],
      };

      secureLogger.info('Array data', data);

      expect(logger.info).toHaveBeenCalledWith('Array data', {
        integration: 'test-integration',
        tokens: ['***REDACTED***', '***REDACTED***'],
        emails: ['us***@example.com', 'us***@example.com'],
      });
    });
  });

  describe('warn', () => {
    it('should log warning with redacted data', () => {
      const data = {
        authorization: 'Bearer secret-token',
        message: 'Warning message',
      };

      secureLogger.warn('Test warning', data);

      expect(logger.warn).toHaveBeenCalledWith('Test warning', {
        integration: 'test-integration',
        authorization: '***REDACTED***',
        message: 'Warning message',
      });
    });
  });

  describe('error', () => {
    it('should log error with redacted data', () => {
      const error = new Error('Test error');
      const data = {
        secret: 'my-secret',
        context: 'error context',
      };

      secureLogger.error('Test error', error, data);

      expect(logger.error).toHaveBeenCalledWith('Test error', {
        integration: 'test-integration',
        error: error.message,
        stack: error.stack,
        secret: '***REDACTED***',
        context: 'error context',
      });
    });

    it('should handle error without additional data', () => {
      const error = new Error('Simple error');

      secureLogger.error('Error occurred', error);

      expect(logger.error).toHaveBeenCalledWith('Error occurred', {
        integration: 'test-integration',
        error: error.message,
        stack: error.stack,
      });
    });
  });

  describe('redaction rules', () => {
    it('should redact fields containing "token"', () => {
      const data = {
        accessToken: 'token123',
        refreshToken: 'refresh456',
        apiToken: 'api789',
      };

      secureLogger.info('Token test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.accessToken).toBe('***REDACTED***');
      expect(call.refreshToken).toBe('***REDACTED***');
      expect(call.apiToken).toBe('***REDACTED***');
    });

    it('should redact fields containing "password"', () => {
      const data = {
        password: 'mypassword',
        userPassword: 'pass123',
        passwordHash: 'hash456',
      };

      secureLogger.info('Password test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.password).toBe('***REDACTED***');
      expect(call.userPassword).toBe('***REDACTED***');
      expect(call.passwordHash).toBe('***REDACTED***');
    });

    it('should redact fields containing "secret"', () => {
      const data = {
        secret: 'mysecret',
        clientSecret: 'client123',
        secretKey: 'key456',
      };

      secureLogger.info('Secret test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.secret).toBe('***REDACTED***');
      expect(call.clientSecret).toBe('***REDACTED***');
      expect(call.secretKey).toBe('***REDACTED***');
    });

    it('should redact fields containing "key"', () => {
      const data = {
        apiKey: 'key123',
        privateKey: 'private456',
        encryptionKey: 'encrypt789',
      };

      secureLogger.info('Key test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.apiKey).toBe('***REDACTED***');
      expect(call.privateKey).toBe('***REDACTED***');
      expect(call.encryptionKey).toBe('***REDACTED***');
    });

    it('should redact fields containing "authorization"', () => {
      const data = {
        authorization: 'Bearer token123',
        authorizationHeader: 'Basic abc123',
      };

      secureLogger.info('Auth test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.authorization).toBe('***REDACTED***');
      expect(call.authorizationHeader).toBe('***REDACTED***');
    });

    it('should mask email addresses', () => {
      const data = {
        email: 'user@example.com',
        userEmail: 'john.doe@company.org',
        contactEmail: 'a@b.com',
      };

      secureLogger.info('Email test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.email).toBe('us***@example.com');
      expect(call.userEmail).toBe('jo***@company.org');
      expect(call.contactEmail).toBe('a@b.com'); // Short emails kept as-is
    });

    it('should not redact safe fields', () => {
      const data = {
        username: 'testuser',
        id: '123',
        status: 'active',
        count: 42,
      };

      secureLogger.info('Safe fields test', data);

      const call = (logger.info as jest.Mock).mock.calls[0][1];
      expect(call.username).toBe('testuser');
      expect(call.id).toBe('123');
      expect(call.status).toBe('active');
      expect(call.count).toBe(42);
    });
  });

  describe('email masking', () => {
    it('should mask email with 2 characters visible', () => {
      const result = (secureLogger as any).maskEmail('user@example.com');
      expect(result).toBe('us***@example.com');
    });

    it('should mask short email addresses', () => {
      const result = (secureLogger as any).maskEmail('ab@example.com');
      expect(result).toBe('ab@example.com');
    });

    it('should handle single character before @', () => {
      const result = (secureLogger as any).maskEmail('a@example.com');
      expect(result).toBe('a@example.com');
    });

    it('should handle long email addresses', () => {
      const result = (secureLogger as any).maskEmail('verylongemail@example.com');
      expect(result).toBe('ve***@example.com');
    });
  });

  describe('integration context', () => {
    it('should include integration name in all logs', () => {
      secureLogger.info('Test message');

      expect(logger.info).toHaveBeenCalledWith('Test message', {
        integration: 'test-integration',
      });
    });

    it('should support different integration names', () => {
      const jiraLogger = new SecureLogger('jira');
      const githubLogger = new SecureLogger('github');

      jiraLogger.info('Jira log');
      githubLogger.info('GitHub log');

      expect(logger.info).toHaveBeenCalledWith('Jira log', {
        integration: 'jira',
      });
      expect(logger.info).toHaveBeenCalledWith('GitHub log', {
        integration: 'github',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null data', () => {
      secureLogger.info('Null data', null as any);

      expect(logger.info).toHaveBeenCalledWith('Null data', {
        integration: 'test-integration',
      });
    });

    it('should handle undefined data', () => {
      secureLogger.info('Undefined data', undefined);

      expect(logger.info).toHaveBeenCalledWith('Undefined data', {
        integration: 'test-integration',
      });
    });

    it('should handle circular references', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      expect(() => secureLogger.info('Circular data', circular)).not.toThrow();
    });

    it('should handle non-object data', () => {
      secureLogger.info('String data', 'just a string' as any);

      expect(logger.info).toHaveBeenCalled();
    });
  });
});
