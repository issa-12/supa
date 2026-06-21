import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BooksService } from '../books/books.service';
import {
  CreateShelfItemDto,
  ReplaceShelfItemDto,
  ShelfItemDto,
  SHELF_STATUSES,
  ShelfStatus,
  UpdateShelfItemDto,
} from './dto/shelf-item.dto';

const SELECT =
  'user_book_id, book_id, status_id, rating, review_text, current_page, total_pages, added_at, updated_at, ' +
  'books(book_id, title, author_name, cover_image_url, google_books_id)';

@Injectable()
export class PublicShelfService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly books: BooksService,
  ) {}

  // reading_statuses is a static seed table — resolve name<->id once and cache.
  private statusMap?: Promise<{ byName: Map<string, number>; byId: Map<number, string> }>;

  private resolveStatuses() {
    this.statusMap ??= (async () => {
      const { data, error } = await this.supabase
        .getAdmin()
        .from('reading_statuses')
        .select('status_id, status_name');
      if (error) {
        this.statusMap = undefined; // allow retry on a transient failure
        throw error;
      }
      const byName = new Map<string, number>();
      const byId = new Map<number, string>();
      (data ?? []).forEach((r) => {
        byName.set(r['status_name'] as string, r['status_id'] as number);
        byId.set(r['status_id'] as number, r['status_name'] as string);
      });
      return { byName, byId };
    })();
    return this.statusMap;
  }

  async list(
    userId: string,
    opts: { status?: string; page: number; limit: number },
  ): Promise<ShelfItemDto[]> {
    const { byName, byId } = await this.resolveStatuses();
    const limit = clamp(opts.limit, 1, 100);
    const offset = Math.max(0, opts.page) * limit;

    let query = this.supabase
      .getAdmin()
      .from('user_books')
      .select(SELECT)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (opts.status) {
      const statusId = byName.get(this.assertStatus(opts.status));
      if (statusId) query = query.eq('status_id', statusId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return asRows(data).map((r) => this.toDto(r, byId));
  }

  async get(userId: string, id: number): Promise<ShelfItemDto> {
    const { byId } = await this.resolveStatuses();
    const row = await this.fetchOwned(userId, id);
    return this.toDto(row, byId);
  }

  async create(userId: string, body: CreateShelfItemDto): Promise<ShelfItemDto> {
    const { byName, byId } = await this.resolveStatuses();
    const googleId = (body.googleBooksId ?? '').trim();
    if (!googleId) throw new BadRequestException('googleBooksId is required.');
    const statusId = byName.get(this.assertStatus(body.status));
    if (!statusId) throw new BadRequestException('Unknown status.');

    const { bookId } = await this.books.ensureBook({ googleId });

    const admin = this.supabase.getAdmin();
    // One shelf row per (user, book): reject a duplicate with a clear 400.
    const { data: existing } = await admin
      .from('user_books')
      .select('user_book_id')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();
    if (existing) {
      throw new BadRequestException('This book is already on your shelf. Use PUT/PATCH to update it.');
    }

    const { data, error } = await admin
      .from('user_books')
      .insert({
        user_id: userId,
        book_id: bookId,
        status_id: statusId,
        rating: this.validRating(body.rating),
        review_text: this.validText(body.review, 2000),
        current_page: this.validPage(body.currentPage),
        total_pages: this.validPage(body.totalPages),
      })
      .select(SELECT)
      .single();
    if (error) throw error;
    return this.toDto(asRow(data), byId);
  }

  // PUT — full replace of the mutable representation. Any optional field omitted
  // is reset to null (idempotent: the same request always yields the same row).
  async replace(userId: string, id: number, body: ReplaceShelfItemDto): Promise<ShelfItemDto> {
    const { byName, byId } = await this.resolveStatuses();
    await this.fetchOwned(userId, id); // 404 if not owned
    const statusId = byName.get(this.assertStatus(body.status));
    if (!statusId) throw new BadRequestException('Unknown status.');

    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .update({
        status_id: statusId,
        rating: this.validRating(body.rating ?? null),
        review_text: this.validText(body.review ?? null, 2000),
        current_page: this.validPage(body.currentPage ?? null),
        total_pages: this.validPage(body.totalPages ?? null),
        updated_at: new Date().toISOString(),
      })
      .eq('user_book_id', id)
      .eq('user_id', userId)
      .select(SELECT)
      .single();
    if (error) throw error;
    return this.toDto(asRow(data), byId);
  }

  // PATCH — partial update; only the provided fields change.
  async update(userId: string, id: number, body: UpdateShelfItemDto): Promise<ShelfItemDto> {
    const { byName, byId } = await this.resolveStatuses();
    await this.fetchOwned(userId, id);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status !== undefined) {
      const statusId = byName.get(this.assertStatus(body.status));
      if (!statusId) throw new BadRequestException('Unknown status.');
      patch['status_id'] = statusId;
    }
    if (body.rating !== undefined) patch['rating'] = this.validRating(body.rating);
    if (body.review !== undefined) patch['review_text'] = this.validText(body.review, 2000);
    if (body.currentPage !== undefined) patch['current_page'] = this.validPage(body.currentPage);
    if (body.totalPages !== undefined) patch['total_pages'] = this.validPage(body.totalPages);

    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .update(patch)
      .eq('user_book_id', id)
      .eq('user_id', userId)
      .select(SELECT)
      .single();
    if (error) throw error;
    return this.toDto(asRow(data), byId);
  }

  async remove(userId: string, id: number): Promise<void> {
    await this.fetchOwned(userId, id);
    const { error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .delete()
      .eq('user_book_id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  private async fetchOwned(userId: string, id: number): Promise<Record<string, unknown>> {
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException('Invalid shelf item id.');
    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select(SELECT)
      .eq('user_book_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Shelf item not found.');
    return asRow(data);
  }

  private assertStatus(status: string): ShelfStatus {
    if (!(SHELF_STATUSES as readonly string[]).includes(status)) {
      throw new BadRequestException(`status must be one of: ${SHELF_STATUSES.join(', ')}.`);
    }
    return status as ShelfStatus;
  }

  private validRating(rating: number | null | undefined): number | null {
    if (rating === null || rating === undefined) return null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('rating must be an integer between 1 and 5, or null.');
    }
    return rating;
  }

  private validPage(page: number | null | undefined): number | null {
    if (page === null || page === undefined) return null;
    if (!Number.isInteger(page) || page < 0) {
      throw new BadRequestException('page values must be non-negative integers, or null.');
    }
    return page;
  }

  private validText(text: string | null | undefined, max: number): string | null {
    if (text === null || text === undefined) return null;
    if (typeof text !== 'string') throw new BadRequestException('Text fields must be strings.');
    const trimmed = text.trim();
    if (trimmed.length > max) throw new BadRequestException(`Text must be ${max} characters or fewer.`);
    return trimmed.length ? trimmed : null;
  }

  private toDto(r: Record<string, unknown>, byId: Map<number, string>): ShelfItemDto {
    const book = (r['books'] ?? {}) as Record<string, unknown>;
    return {
      id: r['user_book_id'] as number,
      status: (byId.get(r['status_id'] as number) ?? 'want_to_read') as ShelfStatus,
      rating: (r['rating'] as number) ?? null,
      review: (r['review_text'] as string) ?? null,
      currentPage: (r['current_page'] as number) ?? null,
      totalPages: (r['total_pages'] as number) ?? null,
      addedAt: r['added_at'] as string,
      updatedAt: (r['updated_at'] as string) ?? null,
      book: {
        bookId: book['book_id'] as number,
        googleBooksId: (book['google_books_id'] as string) ?? null,
        title: (book['title'] as string) ?? 'Untitled',
        author: (book['author_name'] as string) ?? 'Unknown Author',
        coverUrl: (book['cover_image_url'] as string) ?? null,
      },
    };
  }
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

// supabase-js infers a `GenericStringError` union for embedded selects on the
// untyped admin client. The runtime shape is a plain row, so normalise it.
function asRow(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

function asRows(data: unknown): Record<string, unknown>[] {
  return (data ?? []) as unknown as Record<string, unknown>[];
}
