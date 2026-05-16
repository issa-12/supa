import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface GoogleBooksApiResponse {
  totalItems?: number;
  items?: GoogleBookItem[];
}

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface BookDetail {
  googleId: string;
  dbBookId: number | null;
  title: string;
  author: string;
  description: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  categories: string[];
}

export interface SearchedBook {
  googleId: string;
  title: string;
  author: string;
  description: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  categories: string[];
}

@Injectable()
export class BooksService {
  constructor(private readonly supabase: SupabaseService) {}

  async searchGoogleBooks(
    query: string,
    maxResults: number,
    startIndex: number,
  ): Promise<{ books: SearchedBook[]; totalItems: number }> {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(maxResults),
      startIndex: String(startIndex),
      printType: 'books',
    });

    const apiKey = process.env['GOOGLE_BOOKS_API_KEY'];
    if (apiKey) params.set('key', apiKey);

    try {
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);

      if (res.ok) {
        const data = (await res.json()) as GoogleBooksApiResponse;
        return {
          books: (data.items ?? []).map((item) => this.mapItem(item)),
          totalItems: data.totalItems ?? 0,
        };
      }

      const body = await res.text().catch(() => '');
      console.error(`[BooksService] Google Books API ${res.status}:`, body.slice(0, 300));
    } catch (err) {
      console.error('[BooksService] Google Books network error:', err);
    }

    // Fallback: search local catalog
    return this.searchLocalBooks(query, maxResults);
  }

  private async searchLocalBooks(
    query: string,
    limit: number,
  ): Promise<{ books: SearchedBook[]; totalItems: number }> {
    const { data } = await this.supabase
      .getAdmin()
      .from('books')
      .select('*')
      .ilike('title', `%${query}%`)
      .limit(limit);

    const books: SearchedBook[] = (data ?? []).map((b) => ({
      googleId: (b['google_books_id'] as string) ?? '',
      title: b['title'] as string,
      author: b['author_name'] as string,
      description: (b['description'] as string) ?? null,
      publishedDate: (b['publish_date'] as string) ?? null,
      coverUrl: (b['cover_image_url'] as string) ?? null,
      pageCount: (b['page_count'] as number) ?? null,
      categories: (b['categories'] as string[]) ?? [],
    }));

    return { books, totalItems: books.length };
  }

  async getBookByGoogleId(googleId: string): Promise<BookDetail> {
    // 1. Check our DB first
    const admin = this.supabase.getAdmin();
    const { data: dbBook } = await admin
      .from('books')
      .select('*')
      .eq('google_books_id', googleId)
      .maybeSingle();

    if (dbBook) {
      return {
        googleId,
        dbBookId: dbBook['book_id'] as number,
        title: dbBook['title'],
        author: dbBook['author_name'],
        description: dbBook['description'] ?? null,
        publishedDate: dbBook['publish_date'] ?? null,
        coverUrl: dbBook['cover_image_url'] ?? null,
        pageCount: dbBook['page_count'] ?? null,
        categories: dbBook['categories'] ?? [],
      };
    }

    // 2. Fallback to Google Books API
    const apiKey = process.env['GOOGLE_BOOKS_API_KEY'];
    const url = `https://www.googleapis.com/books/v1/volumes/${googleId}${apiKey ? `?key=${apiKey}` : ''}`;

    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new InternalServerErrorException('Failed to fetch book details.');
    }

    if (!res.ok) {
      throw new NotFoundException('Book not found.');
    }

    const item = (await res.json()) as GoogleBookItem;
    const mapped = this.mapItem(item);
    return { ...mapped, dbBookId: null };
  }

  private mapItem(item: GoogleBookItem): SearchedBook {
    const v = item.volumeInfo;
    const thumbnail = v.imageLinks?.thumbnail ?? null;
    return {
      googleId: item.id,
      title: v.title ?? 'Unknown Title',
      author: (v.authors ?? []).join(', ') || 'Unknown Author',
      description: v.description ?? null,
      publishedDate: v.publishedDate ?? null,
      coverUrl: thumbnail ? thumbnail.replace('http://', 'https://') : null,
      pageCount: v.pageCount ?? null,
      categories: v.categories ?? [],
    };
  }
}
