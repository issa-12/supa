import { Controller, Get, Param, Query } from '@nestjs/common';
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

    // Search-as-you-type clients fire on every keystroke; a 1-char query is
    // not an error, just "too short to search yet" — return empty instead of a
    // 400 so the browser console stays clean.
    if (query.length < 2) {
      return { books: [], totalItems: 0 };
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
