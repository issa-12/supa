import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get('search')
  async search(
    @Query('q') q: string,
    @Query('maxResults') maxResults = '20',
    @Query('startIndex') startIndex = '0',
  ) {
    const query = q?.trim() ?? '';

    if (!query || query.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters.');
    }

    const max = Math.min(Number(maxResults) || 20, 40);
    const offset = Number(startIndex) || 0;

    return this.booksService.searchGoogleBooks(query, max, offset);
  }

  @Get(':googleId')
  async getBook(@Param('googleId') googleId: string) {
    return this.booksService.getBookByGoogleId(googleId);
  }
}
