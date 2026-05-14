import { Controller, Get, Headers, Query, UnauthorizedException } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get('global')
  async getGlobalStats(
    @Headers('authorization') auth: string,
    @Query('period') period?: string,
  ) {
    const token = extractToken(auth);
    await this.service.verifyUser(token);
    const p = period === 'month' ? 'month' : 'week';
    const [topBooks, trendingGenres, topReaders] = await Promise.all([
      this.service.getTopBooks(p),
      this.service.getTrendingGenres(),
      this.service.getTopReaders(),
    ]);
    return { topBooks, trendingGenres, topReaders };
  }

  @Get('pace')
  async getReadingPace(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    const userId = await this.service.verifyUser(token);
    const pace = await this.service.getReadingPace(userId);
    return { pace };
  }
}

function extractToken(auth: string): string {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('Missing auth token.');
  return auth.slice(7);
}
