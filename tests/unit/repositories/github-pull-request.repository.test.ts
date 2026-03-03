import { PrismaClient, PullRequestState } from '@prisma/client';
import { GitHubPullRequestRepository } from '../../../src/repositories/github-pull-request.repository';

const prisma = new PrismaClient();
const repository = new GitHubPullRequestRepository(prisma);

describe('GitHubPullRequestRepository', () => {
  let testRepoId: string;
  let testFeatureId: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.gitHubPullRequest.deleteMany();
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
    it('should create a new pull request', async () => {
      const pr = await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Test PR',
        state: PullRequestState.OPEN,
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
      });

      expect(pr).toBeDefined();
      expect(pr.number).toBe(1);
      expect(pr.state).toBe(PullRequestState.OPEN);
    });
  });

  describe('findByNumber', () => {
    it('should find PR by number', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 42,
        title: 'Test PR',
        state: PullRequestState.OPEN,
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
      });

      const found = await repository.findByNumber(testRepoId, 42);
      expect(found).toBeDefined();
      expect(found?.number).toBe(42);
    });

    it('should return null for non-existent PR', async () => {
      const found = await repository.findByNumber(testRepoId, 999);
      expect(found).toBeNull();
    });
  });

  describe('findByRepository', () => {
    it('should find all PRs by repository', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'PR 1',
        state: PullRequestState.OPEN,
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
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 2,
        title: 'PR 2',
        state: PullRequestState.MERGED,
        author: 'testuser',
        reviewCount: 2,
        approvalCount: 2,
        changesRequestedCount: 0,
        commentCount: 5,
        reviewers: ['reviewer1', 'reviewer2'],
        reviewIterations: 1,
        additions: 20,
        deletions: 10,
        filesChanged: 3,
        mergedAt: new Date(),
      });

      const prs = await repository.findByRepository(testRepoId);
      expect(prs).toHaveLength(2);
    });

    it('should filter by state', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Open PR',
        state: PullRequestState.OPEN,
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
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 2,
        title: 'Merged PR',
        state: PullRequestState.MERGED,
        author: 'testuser',
        reviewCount: 1,
        approvalCount: 1,
        changesRequestedCount: 0,
        commentCount: 3,
        reviewers: ['reviewer1'],
        reviewIterations: 1,
        additions: 20,
        deletions: 10,
        filesChanged: 3,
        mergedAt: new Date(),
      });

      const openPRs = await repository.findByRepository(testRepoId, {
        state: PullRequestState.OPEN,
      });

      expect(openPRs).toHaveLength(1);
      expect(openPRs[0].state).toBe(PullRequestState.OPEN);
    });

    it('should filter by date', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Old PR',
        state: PullRequestState.CLOSED,
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
        createdAt: new Date('2024-01-01'),
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 2,
        title: 'Recent PR',
        state: PullRequestState.OPEN,
        author: 'testuser',
        reviewCount: 0,
        approvalCount: 0,
        changesRequestedCount: 0,
        commentCount: 0,
        reviewers: [],
        reviewIterations: 0,
        additions: 20,
        deletions: 10,
        filesChanged: 3,
        createdAt: new Date('2024-06-01'),
      });

      const recentPRs = await repository.findByRepository(testRepoId, {
        since: new Date('2024-05-01'),
      });

      expect(recentPRs).toHaveLength(1);
      expect(recentPRs[0].number).toBe(2);
    });
  });

  describe('findByFeature', () => {
    it('should find PRs associated with feature', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        feature: { connect: { id: testFeatureId } },
        number: 1,
        title: 'Feature PR',
        state: PullRequestState.OPEN,
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
      });

      const prs = await repository.findByFeature(testFeatureId);
      expect(prs).toHaveLength(1);
      expect(prs[0].featureId).toBe(testFeatureId);
    });
  });

  describe('upsertByNumber', () => {
    it('should create new PR if not exists', async () => {
      const pr = await repository.upsertByNumber(testRepoId, 1, {
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'New PR',
        state: PullRequestState.OPEN,
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
      });

      expect(pr).toBeDefined();
      expect(pr.number).toBe(1);
    });

    it('should update existing PR', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Original Title',
        state: PullRequestState.OPEN,
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
      });

      const updated = await repository.upsertByNumber(testRepoId, 1, {
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Updated Title',
        state: PullRequestState.MERGED,
        author: 'testuser',
        reviewCount: 2,
        approvalCount: 2,
        changesRequestedCount: 0,
        commentCount: 5,
        reviewers: ['reviewer1', 'reviewer2'],
        reviewIterations: 1,
        additions: 20,
        deletions: 10,
        filesChanged: 3,
        mergedAt: new Date(),
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.state).toBe(PullRequestState.MERGED);
      expect(updated.reviewCount).toBe(2);
    });
  });

  describe('findMerged', () => {
    it('should find merged PRs', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Merged PR',
        state: PullRequestState.MERGED,
        author: 'testuser',
        reviewCount: 1,
        approvalCount: 1,
        changesRequestedCount: 0,
        commentCount: 3,
        reviewers: ['reviewer1'],
        reviewIterations: 1,
        additions: 10,
        deletions: 5,
        filesChanged: 2,
        mergedAt: new Date('2024-06-01'),
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 2,
        title: 'Open PR',
        state: PullRequestState.OPEN,
        author: 'testuser',
        reviewCount: 0,
        approvalCount: 0,
        changesRequestedCount: 0,
        commentCount: 0,
        reviewers: [],
        reviewIterations: 0,
        additions: 20,
        deletions: 10,
        filesChanged: 3,
      });

      const merged = await repository.findMerged(testRepoId);
      expect(merged).toHaveLength(1);
      expect(merged[0].state).toBe(PullRequestState.MERGED);
    });
  });

  describe('associateWithFeature', () => {
    it('should associate PR with feature', async () => {
      const pr = await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Unassociated PR',
        state: PullRequestState.OPEN,
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
      });

      const associated = await repository.associateWithFeature(pr.id, testFeatureId);
      expect(associated.featureId).toBe(testFeatureId);
    });
  });

  describe('findUnassociated', () => {
    it('should find PRs without feature association', async () => {
      await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'Unassociated PR',
        state: PullRequestState.OPEN,
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
      });

      await repository.create({
        repository: { connect: { id: testRepoId } },
        feature: { connect: { id: testFeatureId } },
        number: 2,
        title: 'Associated PR',
        state: PullRequestState.OPEN,
        author: 'testuser',
        reviewCount: 0,
        approvalCount: 0,
        changesRequestedCount: 0,
        commentCount: 0,
        reviewers: [],
        reviewIterations: 0,
        additions: 20,
        deletions: 10,
        filesChanged: 3,
      });

      const unassociated = await repository.findUnassociated(testRepoId);
      expect(unassociated).toHaveLength(1);
      expect(unassociated[0].number).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete PR', async () => {
      const pr = await repository.create({
        repository: { connect: { id: testRepoId } },
        number: 1,
        title: 'To be deleted',
        state: PullRequestState.OPEN,
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
      });

      await repository.delete(pr.id);

      const found = await repository.findById(pr.id);
      expect(found).toBeNull();
    });
  });
});
