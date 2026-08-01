import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Note } from '../notes/note.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  LOST = 'lost',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum LeadSource {
  WEBSITE = 'website',
  LINKEDIN = 'linkedin',
  COLD_CALL = 'cold_call',
  REFERRAL = 'referral',
  EMAIL = 'email',
  EVENT = 'event',
  OTHER = 'other',
}

export interface StageHistoryEntry {
  from: string;
  to: string;
  changedAt: string;
  reason?: string;
}

@Entity('leads')
export class Lead {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Jane Doe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional({ example: '+1-555-0100' })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ enum: LeadStatus, default: LeadStatus.NEW })
  @Column({ type: 'text', default: LeadStatus.NEW })
  status: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority, default: LeadPriority.MEDIUM })
  @Column({ type: 'text', default: LeadPriority.MEDIUM })
  priority: LeadPriority;

  @ApiPropertyOptional({ enum: LeadSource })
  @Column({ type: 'text', nullable: true })
  source: LeadSource | null;

  @ApiPropertyOptional({ example: 75, description: 'Lead score 0–100' })
  @Column({ type: 'integer', default: 0 })
  score: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Expected deal value in USD',
  })
  @Column({ type: 'real', default: 0 })
  dealValue: number;

  @ApiPropertyOptional({
    example: ['enterprise', 'hot'],
    description: 'Tags as JSON array',
  })
  @Column({ type: 'text', default: '[]' })
  tagsJson: string;

  @ApiPropertyOptional({ default: false })
  @Column({ type: 'boolean', default: false })
  pinned: boolean;

  @ApiPropertyOptional({ description: 'Stage change history as JSON array' })
  @Column({ type: 'text', default: '[]' })
  stageHistoryJson: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Note, (note) => note.lead, { cascade: true })
  notes: Note[];

  // ── Virtual getters (not stored, computed on read) ───────────────────────
  get tags(): string[] {
    try {
      return JSON.parse(this.tagsJson);
    } catch {
      return [];
    }
  }

  get stageHistory(): StageHistoryEntry[] {
    try {
      return JSON.parse(this.stageHistoryJson);
    } catch {
      return [];
    }
  }
}
