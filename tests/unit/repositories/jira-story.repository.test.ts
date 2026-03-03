import { PrismaClient } from '@prisma/client';
import { JiraStoryRepository } from '../../../src/repositories/jira-story.repository';

const prisma = new PrismaClient();
const repository = new JiraStoryRepository(prisma);

describe('JiraStoryRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.jiraStory.deleteMany();
    await prisma.feature.deleteMany();
  });

  describe('create', () => {
    it('should create a new Jira story', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-001',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      const jiraStory = await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-001',
        storyPoints: 5,
        originalEstimate: 28800,
        status: 'In Progress',
        summary: 'Test story',
        lastSyncedAt: new Date(),
      });

      expect(jiraStory).toBeDefined();
      expect(jiraStory.jiraKey).toBe('TEST-001');
      expect(jiraStory.storyPoints).toBe(5);
      expect(jiraStory.featureId).toBe(feature.id);
    });
  });

  describe('findByJiraKey', () => {
    it('should find Jira story by key', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-002',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-002',
        status: 'Done',
        summary: 'Test story',
        lastSyncedAt: new Date(),
      });

      const found = await repository.findByJiraKey('TEST-002');
      expect(found).toBeDefined();
      expect(found?.jiraKey).toBe('TEST-002');
    });

    it('should return null for non-existent key', async () => {
      const found = await repository.findByJiraKey('NONEXISTENT-999');
      expect(found).toBeNull();
    });
  });

  describe('findByFeatureId', () => {
    it('should find Jira story by feature ID', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-003',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-003',
        status: 'Done',
        summary: 'Test story',
        lastSyncedAt: new Date(),
      });

      const found = await repository.findByFeatureId(feature.id);
      expect(found).toBeDefined();
      expect(found?.featureId).toBe(feature.id);
    });
  });

  describe('upsertByJiraKey', () => {
    it('should create new story if not exists', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-004',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      const jiraStory = await repository.upsertByJiraKey('TEST-004', {
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-004',
        storyPoints: 3,
        status: 'To Do',
        summary: 'New story',
        lastSyncedAt: new Date(),
      });

      expect(jiraStory).toBeDefined();
      expect(jiraStory.jiraKey).toBe('TEST-004');
      expect(jiraStory.storyPoints).toBe(3);
    });

    it('should update existing story', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-005',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-005',
        storyPoints: 3,
        status: 'To Do',
        summary: 'Original summary',
        lastSyncedAt: new Date('2024-01-01'),
      });

      const updated = await repository.upsertByJiraKey('TEST-005', {
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-005',
        storyPoints: 5,
        status: 'In Progress',
        summary: 'Updated summary',
        lastSyncedAt: new Date('2024-01-02'),
      });

      expect(updated.storyPoints).toBe(5);
      expect(updated.status).toBe('In Progress');
      expect(updated.summary).toBe('Updated summary');
    });
  });

  describe('findStale', () => {
    it('should find stories not synced recently', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-006',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      const oldDate = new Date('2024-01-01');
      const recentDate = new Date();

      await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-006',
        status: 'Done',
        summary: 'Old story',
        lastSyncedAt: oldDate,
      });

      await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-007',
        status: 'Done',
        summary: 'Recent story',
        lastSyncedAt: recentDate,
      });

      const cutoff = new Date('2024-06-01');
      const stale = await repository.findStale(cutoff);

      expect(stale).toHaveLength(1);
      expect(stale[0].jiraKey).toBe('TEST-006');
    });
  });

  describe('update', () => {
    it('should update Jira story', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-008',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      const created = await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-008',
        storyPoints: 3,
        status: 'To Do',
        summary: 'Original',
        lastSyncedAt: new Date(),
      });

      const updated = await repository.update(created.id, {
        storyPoints: 8,
        status: 'Done',
      });

      expect(updated.storyPoints).toBe(8);
      expect(updated.status).toBe('Done');
    });
  });

  describe('delete', () => {
    it('should delete Jira story', async () => {
      const feature = await prisma.feature.create({
        data: {
          featureId: 'TEST-009',
          name: 'Test Feature',
          status: 'IN_PROGRESS',
          currentPhase: 'CONSTRUCTION',
        },
      });

      const created = await repository.create({
        feature: { connect: { id: feature.id } },
        jiraKey: 'TEST-009',
        status: 'Done',
        summary: 'To be deleted',
        lastSyncedAt: new Date(),
      });

      await repository.delete(created.id);

      const found = await repository.findByJiraKey('TEST-009');
      expect(found).toBeNull();
    });
  });
});
