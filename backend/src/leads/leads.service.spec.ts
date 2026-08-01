import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { LeadsService } from './leads.service';
import { Lead, LeadStatus, LeadPriority } from './lead.entity';

const mockLead = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1-555-0000',
  status: LeadStatus.NEW,
  priority: LeadPriority.MEDIUM,
  source: null,
  score: 0,
  dealValue: 0,
  pinned: false,
  tagsJson: '[]',
  stageHistoryJson: '[]',
  createdAt: new Date(),
  notes: [],
  get tags() {
    return [];
  },
  get stageHistory() {
    return [];
  },
} as unknown as Lead;

const mockRepo = () => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('LeadsService', () => {
  let service: LeadsService;
  let repo: jest.Mocked<Repository<Lead>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getRepositoryToken(Lead), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repo = module.get(getRepositoryToken(Lead));
  });

  describe('findOne', () => {
    it('returns a lead when it exists', async () => {
      repo.findOne.mockResolvedValue(mockLead);
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('throws NotFoundException when lead is missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      name: 'New Lead',
      email: 'new@example.com',
      phone: '+1-555-0001',
    };

    it('creates and returns a lead', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(mockLead);
      repo.save.mockResolvedValue(mockLead);
      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException on duplicate email', async () => {
      repo.findOne.mockResolvedValue(mockLead);
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes an existing lead', async () => {
      repo.findOne.mockResolvedValue(mockLead);
      repo.remove.mockResolvedValue(mockLead);
      await expect(service.remove(1)).resolves.toBeUndefined();
    });

    it('throws NotFoundException for missing lead', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      repo.findAndCount.mockResolvedValue([[mockLead], 1]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getAnalyticsSummary', () => {
    it('returns summary with correct total', async () => {
      repo.find.mockResolvedValue([mockLead]);
      const summary = await service.getAnalyticsSummary();
      expect(summary.total).toBe(1);
      expect(summary.byStatus).toBeDefined();
      expect(summary.winRate).toBeDefined();
    });
  });
});
