import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './leads/lead.entity';
import { Note } from './notes/note.entity';
import { LeadsModule } from './leads/leads.module';
import { NotesModule } from './notes/notes.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'leads.sqlite',
      entities: [Lead, Note],
      synchronize: true,
    }),
    LeadsModule,
    NotesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
