import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly notesRepo: Repository<Note>,
    private readonly leadsService: LeadsService,
  ) {}

  async findAllByLead(leadId: number): Promise<Note[]> {
    // Verify lead exists first (throws 404 if not)
    await this.leadsService.findOne(leadId);

    return this.notesRepo.find({
      where: { leadId },
      order: { createdAt: 'ASC' },
    });
  }

  async create(leadId: number, dto: CreateNoteDto): Promise<Note> {
    // Verify lead exists first (throws 404 if not)
    await this.leadsService.findOne(leadId);

    const note = this.notesRepo.create({ ...dto, leadId });
    return this.notesRepo.save(note);
  }
}
