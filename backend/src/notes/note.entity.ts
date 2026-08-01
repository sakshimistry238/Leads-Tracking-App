import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Lead } from '../leads/lead.entity';

@Entity('notes')
export class Note {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'ID of the associated lead' })
  @Column()
  leadId: number;

  @ApiProperty({
    example: 'Called and left voicemail.',
    description: 'Note content',
  })
  @Column('text')
  content: string;

  @ApiProperty({ description: 'Timestamp when the note was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Lead, (lead) => lead.notes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leadId' })
  lead: Lead;
}
