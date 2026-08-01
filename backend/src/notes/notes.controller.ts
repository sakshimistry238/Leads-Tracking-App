import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note } from './note.entity';

@ApiTags('Notes')
@Controller('api/leads/:leadId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notes for a lead' })
  @ApiOkResponse({ description: 'List of notes', type: [Note] })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  findAll(@Param('leadId', ParseIntPipe) leadId: number) {
    return this.notesService.findAllByLead(leadId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a note to a lead' })
  @ApiCreatedResponse({ description: 'Note created', type: Note })
  @ApiNotFoundResponse({ description: 'Lead not found' })
  create(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.create(leadId, dto);
  }
}
