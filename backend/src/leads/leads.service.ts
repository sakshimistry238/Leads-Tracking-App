import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import {
  Lead,
  LeadPriority,
  LeadSource,
  LeadStatus,
  StageHistoryEntry,
} from './lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import type {
  BulkImportResult,
  ImportLeadRow,
  ImportRowResult,
} from './dto/import-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepo: Repository<Lead>,
  ) {}

  // ── helpers ───────────────────────────────────────────────────────────────
  private serialize(lead: Lead) {
    return {
      ...lead,
      tags: lead.tags,
      stageHistory: lead.stageHistory,
      tagsJson: undefined,
      stageHistoryJson: undefined,
    };
  }

  private saveTags(dto: CreateLeadDto | UpdateLeadDto, lead: Lead) {
    if (dto.tags !== undefined) {
      lead.tagsJson = JSON.stringify(dto.tags);
    }
  }

  // ── findAll ───────────────────────────────────────────────────────────────
  async findAll(query: QueryLeadDto) {
    const {
      search,
      status,
      priority,
      source,
      tag,
      pinned,
      page = 1,
      limit = 10,
    } = query;

    // Fetch all matching rows, then filter tag in memory (SQLite JSON support is limited)
    const where: any[] = [];

    const addWhere = (base: Record<string, any>) => {
      if (status) base.status = status;
      if (priority) base.priority = priority;
      if (source) base.source = source;
      if (pinned !== undefined) base.pinned = pinned;
      return base;
    };

    if (search) {
      where.push(addWhere({ name: ILike(`%${search}%`) }));
      where.push(addWhere({ email: ILike(`%${search}%`) }));
    } else {
      const base = addWhere({});
      if (Object.keys(base).length > 0) where.push(base);
    }

    let [data, total] = await this.leadsRepo.findAndCount({
      where: where.length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
    });

    // tag filter (in-memory since SQLite has no JSON_CONTAINS)
    if (tag) {
      data = data.filter((l) => l.tags.includes(tag));
      total = data.length;
    }

    // also filter tag match inside search results that matched by name/email
    const serialized = data.map((l) => this.serialize(l));
    const paginated = serialized.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── findOne ───────────────────────────────────────────────────────────────
  async findOne(id: number) {
    const lead = await this.leadsRepo.findOne({
      where: { id },
      relations: { notes: true },
      order: { notes: { createdAt: 'ASC' } },
    });
    if (!lead) throw new NotFoundException(`Lead with id ${id} not found`);
    return this.serialize(lead);
  }

  // ── create ────────────────────────────────────────────────────────────────
  async create(dto: CreateLeadDto) {
    const existing = await this.leadsRepo.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException(
        `A lead with email "${dto.email}" already exists`,
      );

    const lead = this.leadsRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      status: dto.status,
      priority: dto.priority,
      source: dto.source,
      score: dto.score ?? 0,
      dealValue: dto.dealValue ?? 0,
      pinned: dto.pinned ?? false,
      tagsJson: JSON.stringify(dto.tags ?? []),
      stageHistoryJson: '[]',
    });
    const saved = await this.leadsRepo.save(lead);
    return this.serialize(saved);
  }

  // ── update ────────────────────────────────────────────────────────────────
  async update(id: number, dto: UpdateLeadDto) {
    const lead = await this.leadsRepo.findOne({
      where: { id },
      relations: { notes: true },
    });
    if (!lead) throw new NotFoundException(`Lead with id ${id} not found`);

    // Duplicate email check
    if (dto.email && dto.email !== lead.email) {
      const existing = await this.leadsRepo.findOne({
        where: { email: dto.email },
      });
      if (existing)
        throw new ConflictException(
          `A lead with email "${dto.email}" already exists`,
        );
    }

    // Stage history tracking
    if (dto.status && dto.status !== lead.status) {
      const history: StageHistoryEntry[] = lead.stageHistory;
      history.push({
        from: lead.status,
        to: dto.status,
        changedAt: new Date().toISOString(),
        reason: dto.statusChangeReason,
      });
      lead.stageHistoryJson = JSON.stringify(history);
    }

    // Apply scalar fields
    const { statusChangeReason: _r, tags: _t, ...rest } = dto;
    Object.assign(lead, rest);

    // Tags
    this.saveTags(dto, lead);

    const saved = await this.leadsRepo.save(lead);
    return this.serialize(saved);
  }

  // ── remove ────────────────────────────────────────────────────────────────
  async remove(id: number): Promise<void> {
    const lead = await this.leadsRepo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead with id ${id} not found`);
    await this.leadsRepo.remove(lead);
  }

  // ── analytics ─────────────────────────────────────────────────────────────
  async getAnalyticsSummary() {
    const all = await this.leadsRepo.find({ order: { createdAt: 'ASC' } });

    const byStatus: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      lost: 0,
    };
    const bySource: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalDealValue = 0;
    let qualifiedDealValue = 0;

    // Leads per day (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const dailyMap: Record<string, number> = {};

    for (const lead of all) {
      byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
      if (lead.source) bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
      byPriority[lead.priority] = (byPriority[lead.priority] ?? 0) + 1;
      totalDealValue += lead.dealValue ?? 0;
      if (lead.status === 'qualified')
        qualifiedDealValue += lead.dealValue ?? 0;

      const d = new Date(lead.createdAt);
      if (d >= thirtyDaysAgo) {
        const key = d.toISOString().slice(0, 10);
        dailyMap[key] = (dailyMap[key] ?? 0) + 1;
      }
    }

    // Fill gaps in daily data
    const leadsOverTime: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      leadsOverTime.push({ date: key, count: dailyMap[key] ?? 0 });
    }

    const total = all.length;
    const winRate =
      total > 0 ? Math.round((byStatus.qualified / total) * 100) : 0;

    return {
      total,
      byStatus,
      bySource,
      byPriority,
      totalDealValue,
      qualifiedDealValue,
      winRate,
      leadsOverTime,
    };
  }

  // ── Excel export ──────────────────────────────────────────────────────────
  async exportExcel(query: QueryLeadDto): Promise<Buffer> {
    const result = await this.findAll({ ...query, limit: 10000, page: 1 });
    const rows = result.data as any[];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'LeadTrack';
    wb.created = new Date();
    wb.modified = new Date();

    const ws = wb.addWorksheet('Leads Export');

    // ── Columns ─────────────────────────────────────────────────────────────
    ws.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Source', key: 'source', width: 14 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Deal Value', key: 'dealValue', width: 14 },
      { header: 'Tags', key: 'tags', width: 24 },
      { header: 'Pinned', key: 'pinned', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    // ── Header row styling ───────────────────────────────────────────────────
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' },
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: false,
    };
    headerRow.height = 22;
    // Add bottom border to header
    headerRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF4F46E5' } },
      };
    });

    // ── Status colour map ────────────────────────────────────────────────────
    const statusFill: Record<string, string> = {
      new: 'FFDBEAFE',
      contacted: 'FFFEF3C7',
      qualified: 'FFDCFCE7',
      lost: 'FFFEE2E2',
    };
    const priorityFill: Record<string, string> = {
      low: 'FFF1F5F9',
      medium: 'FFEDE9FE',
      high: 'FFFEF3C7',
      urgent: 'FFFEE2E2',
    };

    // ── Data rows ────────────────────────────────────────────────────────────
    rows.forEach((lead, i) => {
      const rowData = {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? '',
        status: lead.status,
        priority: lead.priority,
        source: lead.source ?? '',
        score: lead.score,
        dealValue: lead.dealValue,
        tags: Array.isArray(lead.tags) ? lead.tags.join('; ') : '',
        pinned: lead.pinned ? 'Yes' : 'No',
        createdAt: new Date(lead.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      const row = ws.addRow(rowData);
      row.height = 18;

      // Alternate row shading
      const baseFill = i % 2 === 0 ? 'FFFFFFFF' : 'FFFAFAFA';

      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: baseFill },
        };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      // Colour-code status cell (col E = index 5)
      const statusCell = row.getCell('status');
      const sFill = statusFill[lead.status];
      if (sFill) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: sFill },
        };
        statusCell.font = { bold: true, size: 10 };
      }

      // Colour-code priority cell (col F = index 6)
      const priorityCell = row.getCell('priority');
      const pFill = priorityFill[lead.priority];
      if (pFill) {
        priorityCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: pFill },
        };
      }

      // Score as a percentage bar comment
      const scoreCell = row.getCell('score');
      scoreCell.alignment = { horizontal: 'center' };

      // Deal value as currency format
      const dealCell = row.getCell('dealValue');
      dealCell.numFmt = '$#,##0.00';
      dealCell.value = lead.dealValue;
      dealCell.alignment = { horizontal: 'right' };
    });

    // ── Freeze header + auto-filter ──────────────────────────────────────────
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: 'A1', to: `L${rows.length + 1}` };

    // ── Summary sheet ────────────────────────────────────────────────────────
    const summary = wb.addWorksheet('Summary');
    summary.getColumn(1).width = 20;
    summary.getColumn(2).width = 16;

    const summaryTitle = summary.getCell('A1');
    summaryTitle.value = 'Export Summary';
    summaryTitle.font = { bold: true, size: 14, color: { argb: 'FF6366F1' } };
    summary.getRow(1).height = 24;

    const meta: [string, string | number][] = [
      [
        'Export Date',
        new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ],
      ['Total Leads', rows.length],
      ['New', rows.filter((r) => r.status === 'new').length],
      ['Contacted', rows.filter((r) => r.status === 'contacted').length],
      ['Qualified', rows.filter((r) => r.status === 'qualified').length],
      ['Lost', rows.filter((r) => r.status === 'lost').length],
      ['Total Pipeline', rows.reduce((s, r) => s + (r.dealValue ?? 0), 0)],
    ];

    meta.forEach(([label, value], i) => {
      const r = summary.getRow(i + 3);
      r.height = 18;
      const labelCell = r.getCell(1);
      const valueCell = r.getCell(2);

      labelCell.value = label;
      labelCell.font = { bold: true, size: 11, color: { argb: 'FF64748B' } };
      valueCell.value = value;
      valueCell.font = { size: 11, bold: label === 'Total Pipeline' };

      if (label === 'Total Pipeline') {
        valueCell.numFmt = '$#,##0.00';
      }

      // Shade every other row
      if (i % 2 === 0) {
        [labelCell, valueCell].forEach((c) => {
          c.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        });
      }
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  // ── Excel import template ──────────────────────────────────────────────────
  async generateImportTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'LeadTrack';
    wb.created = new Date();

    const ws = wb.addWorksheet('Leads Import');

    // ── Column definitions ──────────────────────────────────────────────────
    ws.columns = [
      { header: 'name *', key: 'name', width: 22 },
      { header: 'email *', key: 'email', width: 28 },
      { header: 'phone', key: 'phone', width: 18 },
      { header: 'status', key: 'status', width: 14 },
      { header: 'priority', key: 'priority', width: 12 },
      { header: 'source', key: 'source', width: 14 },
      { header: 'score', key: 'score', width: 10 },
      { header: 'dealValue', key: 'dealValue', width: 14 },
      { header: 'tags', key: 'tags', width: 22 },
    ];

    // ── Header row styling ──────────────────────────────────────────────────
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6366F1' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // ── Freeze header ───────────────────────────────────────────────────────
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    // ── Validation dropdowns ────────────────────────────────────────────────
    const statusVals = Object.values(LeadStatus).join(',');
    const priorityVals = Object.values(LeadPriority).join(',');
    const sourceVals = Object.values(LeadSource).join(',');

    for (let row = 2; row <= 101; row++) {
      ws.getCell(`D${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${statusVals}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid status',
        error: `Must be one of: ${statusVals}`,
      };
      ws.getCell(`E${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${priorityVals}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid priority',
        error: `Must be one of: ${priorityVals}`,
      };
      ws.getCell(`F${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${sourceVals}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid source',
        error: `Must be one of: ${sourceVals}`,
      };
    }

    // ── 5 sample rows ───────────────────────────────────────────────────────
    const samples: ImportLeadRow[] = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1-555-0101',
        status: 'new',
        priority: 'high',
        source: 'website',
        score: 85,
        dealValue: 12000,
        tags: 'enterprise;hot',
      },
      {
        name: 'Bob Williams',
        email: 'bob@example.com',
        phone: '+1-555-0102',
        status: 'contacted',
        priority: 'medium',
        source: 'linkedin',
        score: 60,
        dealValue: 5000,
        tags: 'referral',
      },
      {
        name: 'Carol Martinez',
        email: 'carol@example.com',
        phone: '+1-555-0103',
        status: 'qualified',
        priority: 'urgent',
        source: 'referral',
        score: 92,
        dealValue: 25000,
        tags: 'enterprise',
      },
      {
        name: 'David Lee',
        email: 'david@example.com',
        phone: '+1-555-0104',
        status: 'new',
        priority: 'low',
        source: 'cold_call',
        score: 30,
        dealValue: 2000,
        tags: '',
      },
      {
        name: 'Eva Chen',
        email: 'eva@example.com',
        phone: '+1-555-0105',
        status: 'lost',
        priority: 'medium',
        source: 'event',
        score: 20,
        dealValue: 0,
        tags: 'event',
      },
    ];

    samples.forEach((s, i) => {
      const row = ws.addRow([
        s.name,
        s.email,
        s.phone ?? '',
        s.status ?? 'new',
        s.priority ?? 'medium',
        s.source ?? '',
        s.score ?? 0,
        s.dealValue ?? 0,
        s.tags ?? '',
      ]);
      // Alternate row shading
      if (i % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
      row.getCell(1).font = { bold: true };
    });

    // ── Instructions sheet ──────────────────────────────────────────────────
    const info = wb.addWorksheet('Instructions');
    info.getColumn(1).width = 60;
    const notes = [
      ['LeadTrack — Import Template Instructions'],
      [''],
      ['• Columns marked with * are required (name, email)'],
      ['• email must be unique — duplicate emails will be skipped'],
      ['• status values: new | contacted | qualified | lost'],
      ['• priority values: low | medium | high | urgent'],
      [
        '• source values: website | linkedin | cold_call | referral | email | event | other',
      ],
      ['• score: integer 0–100'],
      ['• dealValue: number (USD), e.g. 5000'],
      ['• tags: semicolon-separated, e.g.  hot;enterprise;q4'],
      ['• Do not edit or delete the header row'],
      ['• Remove the sample rows before importing your real data'],
      ['• Save as .xlsx before uploading'],
    ];
    notes.forEach(([line], i) => {
      const cell = info.getCell(`A${i + 1}`);
      cell.value = line;
      if (i === 0)
        cell.font = { bold: true, size: 13, color: { argb: 'FF6366F1' } };
      else cell.font = { size: 12 };
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  // ── Bulk import from Excel ─────────────────────────────────────────────────
  async bulkImport(fileBuffer: Buffer): Promise<BulkImportResult> {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(fileBuffer as any);
    } catch {
      throw new BadRequestException(
        'Invalid Excel file. Please upload a valid .xlsx file.',
      );
    }

    // Accept first sheet regardless of name
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Excel file has no worksheets.');

    // Resolve header columns from row 1
    const headerRow = ws.getRow(1);
    const colIndex: Record<string, number> = {};
    headerRow.eachCell((cell, colNum) => {
      const key = String(cell.value ?? '')
        .replace(/\s*\*\s*$/, '')
        .trim()
        .toLowerCase();
      colIndex[key] = colNum;
    });

    const required = ['name', 'email'];
    for (const r of required) {
      if (!colIndex[r]) {
        throw new BadRequestException(
          `Missing required column "${r}". Make sure you are using the provided template.`,
        );
      }
    }

    const results: ImportRowResult[] = [];
    const dataRows: number[] = [];
    ws.eachRow((_, rowNum) => {
      if (rowNum > 1) dataRows.push(rowNum);
    });

    if (dataRows.length === 0)
      throw new BadRequestException('The file contains no data rows.');
    if (dataRows.length > 500)
      throw new BadRequestException('Maximum 500 rows per import.');

    const getCell = (rowNum: number, key: string): string => {
      const col = colIndex[key];
      if (!col) return '';
      const val = ws.getRow(rowNum).getCell(col).value;
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    for (const rowNum of dataRows) {
      const name = getCell(rowNum, 'name');
      const email = getCell(rowNum, 'email');

      // Skip completely blank rows
      if (!name && !email) continue;

      if (!name) {
        results.push({
          row: rowNum,
          name: '',
          email,
          status: 'error',
          reason: 'name is required',
        });
        continue;
      }
      if (!email) {
        results.push({
          row: rowNum,
          name,
          email: '',
          status: 'error',
          reason: 'email is required',
        });
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.push({
          row: rowNum,
          name,
          email,
          status: 'error',
          reason: `"${email}" is not a valid email`,
        });
        continue;
      }

      // Parse optional columns
      const rawStatus = getCell(rowNum, 'status').toLowerCase();
      const rawPriority = getCell(rowNum, 'priority').toLowerCase();
      const rawSource = getCell(rowNum, 'source').toLowerCase();
      const rawScore = Number(getCell(rowNum, 'score') || '0');
      const rawDeal = Number(
        getCell(rowNum, 'dealvalue') || getCell(rowNum, 'dealvalue') || '0',
      );
      const rawTags = getCell(rowNum, 'tags');

      const status = Object.values(LeadStatus).includes(rawStatus as LeadStatus)
        ? (rawStatus as LeadStatus)
        : LeadStatus.NEW;
      const priority = Object.values(LeadPriority).includes(
        rawPriority as LeadPriority,
      )
        ? (rawPriority as LeadPriority)
        : LeadPriority.MEDIUM;
      const source = Object.values(LeadSource).includes(rawSource as LeadSource)
        ? (rawSource as LeadSource)
        : null;
      const score = isNaN(rawScore) ? 0 : Math.min(100, Math.max(0, rawScore));
      const dealValue = isNaN(rawDeal) ? 0 : Math.max(0, rawDeal);
      const tags = rawTags
        ? rawTags
            .split(';')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      try {
        const lead = this.leadsRepo.create({
          name,
          email,
          phone: getCell(rowNum, 'phone') || undefined,
          status,
          priority,
          source: source ?? undefined,
          score,
          dealValue,
          tagsJson: JSON.stringify(tags),
          stageHistoryJson: '[]',
          pinned: false,
        });
        await this.leadsRepo.save(lead);
        results.push({ row: rowNum, name, email, status: 'created' });
      } catch (err: any) {
        if (
          err?.message?.toLowerCase().includes('unique') ||
          err?.code === 'SQLITE_CONSTRAINT'
        ) {
          results.push({
            row: rowNum,
            name,
            email,
            status: 'skipped',
            reason: 'email already exists',
          });
        } else {
          results.push({
            row: rowNum,
            name,
            email,
            status: 'error',
            reason: err?.message ?? 'Unknown error',
          });
        }
      }
    }

    return {
      total: results.length,
      created: results.filter((r) => r.status === 'created').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    };
  }
}
