import { Controller, Get, Headers, Query, UnauthorizedException } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('dashboard')
  async getDashboard(
    @Headers('authorization') auth: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('scope') scope?: string,
    @Query('status') status?: string,
  ) {
    const userId = await this.service.verifyUser(extractToken(auth));
    const filters = this.service.parseFilters(from, to, scope, status);
    return this.service.getDashboard(userId, filters);
  }

  // Kept as a compatibility endpoint while older clients are phased out.
  @Get('global')
  async getGlobalStats(
    @Headers('authorization') auth: string,
    @Query('period') period?: string,
  ) {
    const userId = await this.service.verifyUser(extractToken(auth));
    const today = new Date();
    const from = new Date(today);
    from.setDate(from.getDate() - (period === 'month' ? 30 : 7));
    const filters = this.service.parseFilters(
      formatDateInput(from),
      formatDateInput(today),
      'community',
      'all',
    );
    const dashboard = await this.service.getDashboard(userId, filters);
    return {
      topBooks: dashboard.topBooks.map((book) => ({
        ...book,
        addCount: book.count,
      })),
      trendingGenres: dashboard.trendingGenres,
      topReaders: dashboard.topReaders,
    };
  }
}

function extractToken(auth: string): string {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing auth token.');
  return auth.slice(7);
}

function formatDateInput(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
