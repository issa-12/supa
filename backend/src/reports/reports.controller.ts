import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createReport(
    @Headers('authorization') auth: string,
    @Body() body: { reportedUserId?: string; reason?: string; description?: string },
  ) {
    const token = extractToken(auth);
    const reporterId = await this.reportsService.verifyUser(token);
    return this.reportsService.createReport({
      reporterId,
      reportedId: body.reportedUserId ?? '',
      reason: body.reason ?? '',
      description: body.description ?? null,
    });
  }
}

function extractToken(auth: string): string {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing auth token.');
  return auth.slice(7);
}
