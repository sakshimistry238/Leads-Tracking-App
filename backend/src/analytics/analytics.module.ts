import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [LeadsModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
