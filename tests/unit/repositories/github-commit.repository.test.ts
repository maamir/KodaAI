import { PrismaClient } from '@prisma/client';
import { GitHubCommitRepository } from '../../../src/repositories/github-commit.repository';

const prisma = new PrismaClient();
const repository = new GitHubCommitRepository(prisma);

describe('GitHubCommitRepository', () => {
  let testRepoId: string;
  let testFeatureId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.gitHubCommit.deleteMany();
    await prisma.gitHubRepository.deleteMany();
    await prisma.feature.deleteMany();

    const repo = await prisma.gitHubRepository.create({
      data: {
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'main',
        isActive: true,
      },
    });
    testRepoId = repo.id;

    const feature = await prisma.feature.create({
      data: {
        featureId: 'TEST-001',
        name: 'Test Feature',
        status: 'IN_PROGRESS',
        currentPhase: 'CONSTRUCTION',
      },
    });
    testFeatureId = feature.id;
  });

  describe('create', () => {
    it('should create a new commit', async () => {
      const commit = await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'abc123def456',
        message: 'Test commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      expect(commit).toBeDefined();
      expect(commit.sha).toBe('abc123def456');
      expect(commit.additions).toBe(10);
    });
  });

  describe('findBySha', () => {
    it('should find commit by SHA', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'findme123',
        message: 'Test commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      const found = await repository.findBySha(testRepoId, 'findme123');
      expect(found).toBeDefined();
      expect(found?.sha).toBe('findme123');
    });

    it('should return null for non-existent SHA', async () => {
      const found = await repository.findBySha(testRepoId, 'nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findByRepository', () => {
    it('should find commits by repository', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'commit1',
        message: 'First commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date('2024-01-01'),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'commit2',
        message: 'Second commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date('2024-01-02'),
        additions: 20,
        deletions: 10,
        totalChanges: 30,
        filesChanged: 3,
      });

      const commits = await repository.findByRepository(testRepoId);
      expect(commits).toHaveLength(2);
      expect(commits[0].sha).toBe('commit2'); // Most recent first
    });

    it('should filter by date range', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'old',
        message: 'Old commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date('2024-01-01'),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'recent',
        message: 'Recent commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date('2024-06-01'),
        additions: 20,
        deletions: 10,
        totalChanges: 30,
        filesChanged: 3,
      });

      const commits = await repository.findByRepository(testRepoId, {
        since: new Date('2024-05-01'),
      });

      expect(commits).toHaveLength(1);
      expect(commits[0].sha).toBe('recent');
    });

    it('should filter by branch', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'main1',
        message: 'Main commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
        branchName: 'main',
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'feature1',
        message: 'Feature commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 20,
        deletions: 10,
        totalChanges: 30,
        filesChanged: 3,
        branchName: 'feature-branch',
      });

      const commits = await repository.findByRepository(testRepoId, {
        branch: 'main',
      });

      expect(commits).toHaveLength(1);
      expect(commits[0].branchName).toBe('main');
    });
  });

  describe('findByFeature', () => {
    it('should find commits associated with feature', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        feature: { connect: { id: testFeatureId } },
        sha: 'feature-commit',
        message: 'Feature commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      const commits = await repository.findByFeature(testFeatureId);
      expect(commits).toHaveLength(1);
      expect(commits[0].featureId).toBe(testFeatureId);
    });
  });

  describe('upsertBySha', () => {
    it('should create new commit if not exists', async () => {
      const commit = await repository.upsertBySha(testRepoId, 'newsha', {
        repository: { connect: { id: testRepoId } },
        sha: 'newsha',
        message: 'New commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      expect(commit).toBeDefined();
      expect(commit.sha).toBe('newsha');
    });

    it('should update existing commit', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'existingsha',
        message: 'Original message',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      const updated = await repository.upsertBySha(testRepoId, 'existingsha', {
        repository: { connect: { id: testRepoId } },
        feature: { connect: { id: testFeatureId } },
        sha: 'existingsha',
        message: 'Updated message',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 20,
        deletions: 10,
        totalChanges: 30,
        filesChanged: 3,
      });

      expect(updated.message).toBe('Updated message');
      expect(updated.featureId).toBe(testFeatureId);
    });
  });

  describe('associateWithFeature', () => {
    it('should associate commit with feature', async () => {
      const commit = await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'unassociated',
        message: 'Unassociated commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      const associated = await repository.associateWithFeature(commit.id, testFeatureId);
      expect(associated.featureId).toBe(testFeatureId);
    });
  });

  describe('findUnassociated', () => {
    it('should find commits without feature association', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'unassociated',
        message: 'Unassociated commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        feature: { connect: { id: testFeatureId } },
        sha: 'associated',
        message: 'Associated commit',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 20,
        deletions: 10,
        totalChanges: 30,
        filesChanged: 3,
      });

      const unassociated = await repository.findUnassociated(testRepoId);
      expect(unassociated).toHaveLength(1);
      expect(unassociated[0].sha).toBe('unassociated');
    });
  });

  describe('delete', () => {
    it('should delete commit', async () => {
      const commit = await repository.create({
        repository: { connect: { id: testRepoId } },
        sha: 'todelete',
        message: 'To be deleted',
        author: 'testuser',
        authorEmail: 'test@example.com',
        committedAt: new Date(),
        additions: 10,
        deletions: 5,
        totalChanges: 15,
        filesChanged: 2,
      });

      await repository.delete(commit.id);

      const found = await repository.findById(commit.id);
      expect(found).toBeNull();
    });
  });
});
