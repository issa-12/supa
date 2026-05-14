import { Controller, Get, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  @Get(':userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Headers('authorization') authHeader: string,
  ) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token.');
    }
    const token = authHeader.slice(7);
    const requestingUserId = await this.service.verifyUser(token);

    if (requestingUserId !== userId) {
      throw new UnauthorizedException('Cannot access recommendations for another user.');
    }

    const books = await this.service.getRecommendations(userId);
    return { books };
  }
}
