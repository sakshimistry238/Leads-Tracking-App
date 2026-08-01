import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';

@ApiTags('Leads')
@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  // ── List ──────────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List leads with search, filter, pagination' })
  @ApiOkResponse({ description: 'Paginated leads' })
  findAll(@Query() query: QueryLeadDto) {
    return this.leadsService.findAll(query);
  }

  // ── Excel Export ─────────────────────────────────────────────────────────
  @Get('export')
  @ApiOperation({ summary: 'Export leads to a styled Excel (.xlsx) workbook' })
  async exportExcel(@Query() query: QueryLeadDto, @Res() res: Response) {
    const buffer = await this.leadsService.exportExcel(query);
    const filename = `leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.end(buffer);
  }

  // ── Excel Import Template ─────────────────────────────────────────────────
  @Get('import/template')
  @ApiOperation({
    summary: 'Download the Excel import template (.xlsx) with 5 sample rows',
  })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.leadsService.generateImportTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="leads_import_template.xlsx"',
    );
    res.end(buffer);
  }

  // ── Bulk Import ───────────────────────────────────────────────────────────
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk import leads from an Excel (.xlsx) file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '.xlsx file to import',
        },
      },
      required: ['file'],
    },
  })
  @ApiOkResponse({ description: 'Import result summary' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.originalname.endsWith('.xlsx')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only .xlsx files are supported'), false);
        }
      },
    }),
  )
  async bulkImport(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');
    return this.leadsService.bulkImport(file.buffer);
  }

  // ── Create ────────────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a lead' })
  @ApiCreatedResponse({ description: 'Lead created' })
  create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  // ── Get one ───────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Get lead with notes' })
  @ApiOkResponse({ description: 'Lead found' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.findOne(id);
  }

  // ── Update ────────────────────────────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  @ApiOkResponse({ description: 'Lead updated' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(id, dto);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lead and notes' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.leadsService.remove(id);
  }
}
