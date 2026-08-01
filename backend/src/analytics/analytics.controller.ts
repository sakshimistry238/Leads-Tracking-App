import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadsService } from '../leads/leads.service';

@ApiTags('Analytics')
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get analytics summary: funnel, win rate, deal values, trends',
  })
  @ApiOkResponse({ description: 'Analytics summary' })
  getSummary() {
    return this.leadsService.getAnalyticsSummary();
  }
}
