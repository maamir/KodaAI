/**
 * Bug Condition Exploration Test for Jira Feature Tracking Fix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * This test encodes the EXPECTED behavior and is designed to FAIL on unfixed code.
 * When this test fails, it demonstrates that the bug exists.
 * When this test passes (after the fix), it confirms the bug is resolved.
 * 
 * Property 1: Fault Condition - Jira Key Detection and Tracking Update
 * 
 * For any user message where a Jira ticket key is mentioned (matches pattern /\b[A-Z]{2,10}-\d+\b/),
 * the system SHALL:
 * 1. Detect the Jira key
 * 2. Fetch ticket details from the Jira API using JiraClient.getIssue()
 * 3. Create or find the corresponding feature in the database using the Jira key as the featureId
 * 4. Update `.kiro/current-feature.json` with the Jira key, ticket summary, and description
 * 5. Cause subsequent webhook events to use the Jira key instead of the hardcoded UUID
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { JiraDetectionService } from '../../src/services/jira-detection.service';
import { JiraClient } from '../../src/integrations/jira/jira-client';
import { FeatureRepository } from '../../src/repositories/feature.repository';

// Mock JiraClient and FeatureRepository to avoid real API/DB calls
jest.mock('../../src/integrations/jira/jira-client');
jest.mock('../../src/repositories/feature.repository');

describe('Bug Condition Exploration: Jira Feature Tracking', () => {
  const CURRENT_FEATURE_PATH = path.join(process.cwd(), '.kiro', 'current-feature.json');
  const HARDCODED_UUID = '28a51c04-260b-491d-adf7-f45f1593074f';
  
  let prisma: PrismaClient;
  let jiraDetectionService: JiraDetectionService;

  beforeAll(() => {
    prisma = new PrismaClient();
    
    // Mock JiraClient.getIssue to return fake ticket data
    const MockedJiraClient = JiraClient as jest.MockedClass<typeof JiraClient>;
    MockedJiraClient.prototype.getIssue = jest.fn().mockImplementation(async function(jiraKey: string) {
      return {
        key: jiraKey,
        fields: {
          summary: `Test Issue ${jiraKey}`,
          description: `Description for ${jiraKey}`,
          status: { name: 'In Progress' },
        },
      };
    });
    
    // Mock FeatureRepository methods
    const MockedFeatureRepository = FeatureRepository as jest.MockedClass<typeof FeatureRepository>;
    MockedFeatureRepository.prototype.findByFeatureId = jest.fn().mockResolvedValue(null);
    MockedFeatureRepository.prototype.create = jest.fn().mockImplementation(async (data: any) => ({
      id: 'mock-feature-id',
      featureId: data.featureId,
      name: data.name,
      status: data.status,
      currentPhase: data.currentPhase,
      startedAt: data.startedAt,
      completedAt: null,
      estimatedHours: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset current-feature.json to hardcoded UUID before each test
    const originalContent = {
      featureId: HARDCODED_UUID,
      name: 'Payment Gateway Integration',
      description: 'Current feature being tracked by Kiro hooks',
    };
    fs.writeFileSync(CURRENT_FEATURE_PATH, JSON.stringify(originalContent, null, 2));
    
    // Create service instance
    jiraDetectionService = new JiraDetectionService(prisma);
  });

  // Helper to generate valid Jira keys
  const jiraKeyArbitrary = fc.tuple(
    fc.stringMatching(/^[A-Z]{2,10}$/), // Project key (2-10 uppercase letters)
    fc.integer({ min: 1, max: 9999 })    // Issue number
  ).map(([project, num]) => `${project}-${num}`);

  // Helper to generate messages containing Jira keys
  const messageWithJiraKeyArbitrary = jiraKeyArbitrary.map(jiraKey => ({
    jiraKey,
    message: `I'm working on ${jiraKey}`,
  }));

  /**
   * Property 1: Jira Key Detection and Tracking Update
   * 
   * This test will FAIL on unfixed code because:
   * - No Jira key detection logic exists
   * - No API calls are made to fetch ticket details
   * - `.kiro/current-feature.json` remains with hardcoded UUID
   * 
   * Expected counterexamples on unfixed code:
   * - `.kiro/current-feature.json` still contains "28a51c04-260b-491d-adf7-f45f1593074f"
   * - featureId is NOT updated to the Jira key
   */
  test('Property 1: When user message contains Jira key, system should update tracking', async () => {
    await fc.assert(
      fc.asyncProperty(messageWithJiraKeyArbitrary, async ({ jiraKey, message }) => {
        // ARRANGE: Reset to hardcoded UUID
        const originalContent = {
          featureId: HARDCODED_UUID,
          name: 'Payment Gateway Integration',
          description: 'Current feature being tracked by Kiro hooks',
        };
        fs.writeFileSync(CURRENT_FEATURE_PATH, JSON.stringify(originalContent, null, 2));
        
        // ACT: Process message with Jira detection service
        await jiraDetectionService.detectAndUpdateFeature(message);
        
        // Read updated current-feature.json
        const currentFeatureContent = fs.readFileSync(CURRENT_FEATURE_PATH, 'utf-8');
        const currentFeature = JSON.parse(currentFeatureContent);

        // ASSERT: Expected behavior (will FAIL on unfixed code)
        // 1. featureId should be the Jira key, NOT the hardcoded UUID
        const isFeatureIdUpdated = currentFeature.featureId === jiraKey;
        
        // 2. featureId should NOT be the hardcoded UUID
        const isNotHardcodedUUID = currentFeature.featureId !== HARDCODED_UUID;

        // This assertion will FAIL on unfixed code, demonstrating the bug
        // The bug: system continues using hardcoded UUID despite Jira key mention
        return isFeatureIdUpdated && isNotHardcodedUUID;
      }),
      {
        numRuns: 10, // Run 10 test cases to find counterexamples
        verbose: true, // Show counterexamples when test fails
      }
    );
  });

  /**
   * Concrete test case: SCRUM-1 example
   * 
   * This is a specific example that should fail on unfixed code.
   * It demonstrates the bug with a concrete Jira key.
   */
  test('Concrete example: Message "I\'m working on SCRUM-1" should update tracking', async () => {
    // ARRANGE
    const jiraKey = 'SCRUM-1';
    const message = `I'm working on ${jiraKey}`;

    // ACT: Process message with Jira detection service
    await jiraDetectionService.detectAndUpdateFeature(message);

    // Read current state
    const currentFeatureContent = fs.readFileSync(CURRENT_FEATURE_PATH, 'utf-8');
    const currentFeature = JSON.parse(currentFeatureContent);

    // ASSERT: Expected behavior (will FAIL on unfixed code)
    expect(currentFeature.featureId).toBe(jiraKey);
    expect(currentFeature.featureId).not.toBe(HARDCODED_UUID);
    
    // Additional assertions for complete behavior
    expect(currentFeature.name).toBeDefined();
    expect(currentFeature.description).toBeDefined();
  });

  /**
   * Concrete test case: PROJ-456 example
   * 
   * Another specific example with different Jira key format.
   */
  test('Concrete example: Message "Let\'s fix PROJ-456" should update tracking', async () => {
    // ARRANGE
    const jiraKey = 'PROJ-456';
    const message = `Let's fix ${jiraKey}`;

    // ACT: Process message with Jira detection service
    await jiraDetectionService.detectAndUpdateFeature(message);

    // Read current state
    const currentFeatureContent = fs.readFileSync(CURRENT_FEATURE_PATH, 'utf-8');
    const currentFeature = JSON.parse(currentFeatureContent);

    // ASSERT: Expected behavior (will FAIL on unfixed code)
    expect(currentFeature.featureId).toBe(jiraKey);
    expect(currentFeature.featureId).not.toBe(HARDCODED_UUID);
  });

  /**
   * Test: Multiple Jira keys - should use first one
   * 
   * When message contains multiple Jira keys, system should detect and use the first one.
   */
  test('Multiple Jira keys: Should use first key detected', async () => {
    // ARRANGE
    const firstKey = 'ABC-123';
    const message = `Moving from ${firstKey} to ABC-456`;

    // ACT: Process message with Jira detection service
    await jiraDetectionService.detectAndUpdateFeature(message);

    // Read current state
    const currentFeatureContent = fs.readFileSync(CURRENT_FEATURE_PATH, 'utf-8');
    const currentFeature = JSON.parse(currentFeatureContent);

    // ASSERT: Should use first key (will FAIL on unfixed code)
    expect(currentFeature.featureId).toBe(firstKey);
    expect(currentFeature.featureId).not.toBe(HARDCODED_UUID);
  });

  /**
   * Test: Jira key regex pattern validation
   * 
   * Verify that the Jira key detection pattern works correctly.
   */
  test('Jira key pattern: Valid keys should be detected', async () => {
    const validKeys = [
      'AB-1',        // Minimum valid key
      'SCRUM-1',     // Common format
      'PROJECT-999', // Longer project name
      'ABCDEFGHIJ-9999', // Maximum length project (10 chars)
    ];

    for (const jiraKey of validKeys) {
      // Reset before each iteration
      const originalContent = {
        featureId: HARDCODED_UUID,
        name: 'Payment Gateway Integration',
        description: 'Current feature being tracked by Kiro hooks',
      };
      fs.writeFileSync(CURRENT_FEATURE_PATH, JSON.stringify(originalContent, null, 2));
      
      const message = `Working on ${jiraKey}`;
      
      // ACT: Process message with Jira detection service
      await jiraDetectionService.detectAndUpdateFeature(message);
      
      // Read current state
      const currentFeatureContent = fs.readFileSync(CURRENT_FEATURE_PATH, 'utf-8');
      const currentFeature = JSON.parse(currentFeatureContent);

      // ASSERT: Should detect and use the Jira key (will FAIL on unfixed code)
      expect(currentFeature.featureId).toBe(jiraKey);
    }
  });

  /**
   * Test: Invalid Jira keys should not be detected
   * 
   * Verify that invalid patterns are not mistakenly detected as Jira keys.
   */
  test('Jira key pattern: Invalid keys should not be detected', async () => {
    const invalidKeys = [
      'A-1',              // Too short project name (1 char)
      'TOOLONGPROJECT-1', // Too long project name (>10 chars)
      'PROJ-',            // Missing issue number
      '123-PROJ',         // Wrong order
      'proj-123',         // Lowercase (depending on requirements)
    ];

    for (const invalidKey of invalidKeys) {
      // Reset before each iteration
      const originalContent = {
        featureId: HARDCODED_UUID,
        name: 'Payment Gateway Integration',
        description: 'Current feature being tracked by Kiro hooks',
      };
      fs.writeFileSync(CURRENT_FEATURE_PATH, JSON.stringify(originalContent, null, 2));
      
      const message = `Working on ${invalidKey}`;
      
      // ACT: Process message with Jira detection service
      await jiraDetectionService.detectAndUpdateFeature(message);
      
      // Read current state
      const currentFeatureContent = fs.readFileSync(CURRENT_FEATURE_PATH, 'utf-8');
      const currentFeature = JSON.parse(currentFeatureContent);

      // ASSERT: Should NOT update to invalid key
      // Should remain as hardcoded UUID
      expect(currentFeature.featureId).toBe(HARDCODED_UUID);
    }
  });
});
