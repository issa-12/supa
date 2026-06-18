import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly supabaseService: SupabaseService,
  ) {}

  // Server-side find-or-create for the shared catalog. Requires a valid session
  // (any authenticated user may contribute Google books), but the actual write
  // happens with the service-role client — the browser has no write access to
  // public.books, which closes the "edit any book" vulnerability.
  @Post('ensure')
  async ensure(
    @Headers('authorization') authHeader: string,
    @Body() body: { googleId?: string; title?: string; author?: string; coverUrl?: string | null; description?: string | null },
  ) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token.');
    }
    const { data } = await this.supabaseService.getAdmin().auth.getUser(authHeader.slice(7));
    if (!data.user) {
      throw new UnauthorizedException('Invalid or expired session.');
    }
    return this.booksService.ensureBook(body ?? {});
  }

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
