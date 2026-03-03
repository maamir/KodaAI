import { PrismaClient } from '@prisma/client';
import { GitHubRepositoryRepository } from '../../../src/repositories/github-repository.repository';

const prisma = new PrismaClient();
const repository = new GitHubRepositoryRepository(prisma);

describe('GitHubRepositoryRepository', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.gitHubCommit.deleteMany();
    await prisma.gitHubPullRequest.deleteMany();
    await prisma.gitHubRepository.deleteMany();
  });

  describe('create', () => {
    it('should create a new GitHub repository', async () => {
      const repo = await repository.create({
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'main',
        isActive: true,
      });

      expect(repo).toBeDefined();
      expect(repo.fullName).toBe('testorg/testrepo');
      expect(repo.isActive).toBe(true);
    });
  });

  describe('findByFullName', () => {
    it('should find repository by full name', async () => {
      await repository.create({
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'main',
        isActive: true,
      });

      const found = await repository.findByFullName('testorg/testrepo');
      expect(found).toBeDefined();
      expect(found?.fullName).toBe('testorg/testrepo');
    });

    it('should return null for non-existent repository', async () => {
      const found = await repository.findByFullName('nonexistent/repo');
      expect(found).toBeNull();
    });
  });

  describe('findAllActive', () => {
    it('should find only active repositories', async () => {
      await repository.create({
        owner: 'testorg',
        name: 'active1',
        fullName: 'testorg/active1',
        defaultBranch: 'main',
        isActive: true,
      });

      await repository.create({
        owner: 'testorg',
        name: 'inactive',
        fullName: 'testorg/inactive',
        defaultBranch: 'main',
        isActive: false,
      });

      await repository.create({
        owner: 'testorg',
        name: 'active2',
        fullName: 'testorg/active2',
        defaultBranch: 'main',
        isActive: true,
      });

      const active = await repository.findAllActive();
      expect(active).toHaveLength(2);
      expect(active.every(r => r.isActive)).toBe(true);
    });
  });

  describe('upsertByFullName', () => {
    it('should create new repository if not exists', async () => {
      const repo = await repository.upsertByFullName('testorg/newrepo', {
        owner: 'testorg',
        name: 'newrepo',
        fullName: 'testorg/newrepo',
        defaultBranch: 'main',
        isActive: true,
      });

      expect(repo).toBeDefined();
      expect(repo.fullName).toBe('testorg/newrepo');
    });

    it('should update existing repository', async () => {
      await repository.create({
        owner: 'testorg',
        name: 'existingrepo',
        fullName: 'testorg/existingrepo',
        defaultBranch: 'master',
        isActive: true,
      });

      const updated = await repository.upsertByFullName('testorg/existingrepo', {
        owner: 'testorg',
        name: 'existingrepo',
        fullName: 'testorg/existingrepo',
        defaultBranch: 'main',
        isActive: false,
        lastSyncedAt: new Date(),
      });

      expect(updated.defaultBranch).toBe('main');
      expect(updated.isActive).toBe(false);
      expect(updated.lastSyncedAt).toBeDefined();
    });
  });

  describe('setActive', () => {
    it('should set repository active status', async () => {
      const repo = await repository.create({
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'main',
        isActive: true,
      });

      const deactivated = await repository.setActive(repo.id, false);
      expect(deactivated.isActive).toBe(false);

      const reactivated = await repository.setActive(repo.id, true);
      expect(reactivated.isActive).toBe(true);
    });
  });

  describe('findByIdWithRelations', () => {
    it('should find repository with commits and PRs', async () => {
      const repo = await repository.create({
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'main',
        isActive: true,
      });

      await prisma.gitHubCommit.create({
        data: {
          repositoryId: repo.id,
          sha: 'abc123',
          message: 'Test commit',
          author: 'testuser',
          authorEmail: 'test@example.com',
          committedAt: new Date(),
          additions: 10,
          deletions: 5,
          totalChanges: 15,
          filesChanged: 2,
        },
      });

      await prisma.gitHubPullRequest.create({
        data: {
          repositoryId: repo.id,
          number: 1,
          title: 'Test PR',
          state: 'OPEN',
          author: 'testuser',
          reviewCount: 0,
          approvalCount: 0,
          changesRequestedCount: 0,
          commentCount: 0,
          reviewers: [],
          reviewIterations: 0,
          additions: 10,
          deletions: 5,
          filesChanged: 2,
        },
      });

      const found = await repository.findByIdWithRelations(repo.id);
      expect(found).toBeDefined();
      expect(found?.commits).toHaveLength(1);
      expect(found?.pullRequests).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update repository', async () => {
      const repo = await repository.create({
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'master',
        isActive: true,
      });

      const updated = await repository.update(repo.id, {
        defaultBranch: 'main',
        lastSyncedAt: new Date(),
      });

      expect(updated.defaultBranch).toBe('main');
      expect(updated.lastSyncedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete repository', async () => {
      const repo = await repository.create({
        owner: 'testorg',
        name: 'testrepo',
        fullName: 'testorg/testrepo',
        defaultBranch: 'main',
        isActive: true,
      });

      await repository.delete(repo.id);

      const found = await repository.findById(repo.id);
      expect(found).toBeNull();
    });
  });
});
