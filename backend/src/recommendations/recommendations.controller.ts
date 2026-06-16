import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly service: RecommendationsService) {}

  // A friend recommends a book → add it to the recipient's shelf + notify.
  // Returns { added: false } when the recipient already has the book.
  @Post('friend')
  async recommendToFriend(
    @Headers('authorization') authHeader: string,
    @Body() body: { toUserId?: string; bookId?: number },
  ) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token.');
    }
    const fromUserId = await this.service.verifyUser(authHeader.slice(7));

    if (!body?.toUserId || typeof body.bookId !== 'number') {
      throw new BadRequestException('toUserId and bookId are required.');
    }

    return this.service.recommendToFriend(fromUserId, body.toUserId, body.bookId);
  }

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
