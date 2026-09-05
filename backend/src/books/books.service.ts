import {
  BadGatewayException,
  Injectable,
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
    language?: string;
  };
  accessInfo?: {
    viewability?: string;
    publicDomain?: boolean;
    epub?: { isAvailable?: boolean };
    pdf?: { isAvailable?: boolean };
  };
  saleInfo?: {
    isEbook?: boolean;
    saleability?: string;
  };
}

export interface RatingBucket {
  star: number;
  count: number;
  percent: number;
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: RatingBucket[];
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
  ratingStats: RatingStats | null;
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
  language: string | null;
  averageRating: number | null;
  ratingsCount: number;
  availability: 'full' | 'preview' | 'none';
  isEbook: boolean;
}

interface BookSearchOptions {
  author?: string;
  language?: string;
  sort?: string;
}

export interface BookSearchResult {
  books: SearchedBook[];
  totalItems: number;
  nextStartIndex: number;
  hasMore: boolean;
  // Where the results came from. 'local' means Google Books was unreachable or
  // rejected the request and we served the local catalog instead, which the
  // client surfaces to the user so unexpectedly thin results are explainable.
  source: 'google' | 'local';
}

@Injectable()
export class BooksService {
  constructor(private readonly supabase: SupabaseService) {}

  async searchGoogleBooks(
    query: string,
    maxResults: number,
    startIndex: number,
    options: BookSearchOptions = {},
  ): Promise<BookSearchResult> {
    const qualifiedQuery = buildProviderQuery(query, options);
    const apiKey = process.env['GOOGLE_BOOKS_API_KEY'];
    const author = options.author?.trim().toLocaleLowerCase() ?? '';
    const language = options.language?.trim().toLowerCase() ?? '';
    const scanLimit = author || language ? 8 : 1;
    const providerPageSize = author || language
      ? 40
      : Math.min(Math.max(maxResults, 12), 40);
    const books: SearchedBook[] = [];
    const seenIds = new Set<string>();
    let cursor = startIndex;
    let totalItems = 0;
    let pagesScanned = 0;
    let exhausted = false;
    let providerFailed = false;

    try {
      while (books.length < maxResults && pagesScanned < scanLimit) {
        const params = new URLSearchParams({
          q: qualifiedQuery,
          maxResults: String(providerPageSize),
          startIndex: String(cursor),
          printType: 'books',
        });
        if (language) params.set('langRestrict', language);
        if (options.sort === 'newest') params.set('orderBy', 'newest');
        if (apiKey) params.set('key', apiKey);

        const res = await fetchGoogleBooks(
          `https://www.googleapis.com/books/v1/volumes?${params}`,
        );
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          console.error(`[BooksService] Google Books API ${res.status}:`, body.slice(0, 300));
          providerFailed = true;
          break;
        }

        const data = (await res.json()) as GoogleBooksApiResponse;
        const items = data.items ?? [];
        totalItems = data.totalItems ?? totalItems;
        pagesScanned++;

        if (items.length === 0) {
          exhausted = true;
          break;
        }

        for (const item of items) {
          cursor++;
          const book = this.mapItem(item);
          if (author && !book.author.toLocaleLowerCase().includes(author)) continue;
          if (language && !matchesLanguage(book, language)) continue;
          if (seenIds.has(book.googleId)) continue;
          seenIds.add(book.googleId);
          books.push(book);
          if (books.length >= maxResults) break;
        }

        if (cursor >= totalItems) {
          exhausted = true;
          break;
        }
      }

      // An HTTP error status from Google (429 over quota, 503 outage) is just
      // as much a provider failure as a thrown network error, so it has to take
      // the same fallback path — returning an empty page here made a working
      // catalog look like "no results". Pages already collected before the
      // failure are real Google data, so those are kept rather than discarded.
      if (providerFailed && books.length === 0) {
        return this.searchLocalBooks(query, maxResults, options);
      }

      if (options.sort === 'newest') {
        books.sort((a, b) =>
          publicationYear(b.publishedDate) - publicationYear(a.publishedDate),
        );
      }

      return {
        books,
        totalItems,
        nextStartIndex: cursor,
        hasMore: books.length === maxResults && !exhausted && cursor < totalItems,
        source: 'google',
      };
    } catch (err) {
      console.error('[BooksService] Google Books network error:', err);
    }

    // Fallback: search local catalog
    return this.searchLocalBooks(query, maxResults, options);
  }

  private async searchLocalBooks(
    query: string,
    limit: number,
    options: BookSearchOptions,
  ): Promise<BookSearchResult> {
    // Match title OR author: this is the path users land on whenever Google
    // Books is down, and searching an author name (the second most common
    // query after a title) previously returned nothing at all.
    // PostgREST's `or` filter is comma-separated with parenthesised groups, so
    // strip the characters that would break out of the expression.
    const safe = query.replace(/[(),*]/g, ' ').trim();
    // A query made up entirely of stripped characters would leave `%%`, which
    // matches the whole catalog. Treat it as no results instead.
    if (!safe) {
      return { books: [], totalItems: 0, nextStartIndex: 0, hasMore: false, source: 'local' };
    }
    let localQuery = this.supabase
      .getAdmin()
      .from('books')
      .select('*')
      .or(`title.ilike.%${safe}%,author_name.ilike.%${safe}%`)
      .limit(limit);
    if (options.author?.trim()) {
      localQuery = localQuery.ilike('author_name', `%${options.author.trim()}%`);
    }
    const { data } = await localQuery;

    let books: SearchedBook[] = (data ?? []).map((b) => ({
      googleId: (b['google_books_id'] as string) ?? '',
      title: b['title'] as string,
      author: b['author_name'] as string,
      description: (b['description'] as string) ?? null,
      publishedDate: (b['publish_date'] as string) ?? null,
      coverUrl: (b['cover_image_url'] as string) ?? null,
      pageCount: (b['page_count'] as number) ?? null,
      categories: (b['categories'] as string[]) ?? [],
      language: (b['language'] as string) ?? null,
      averageRating: null,
      ratingsCount: 0,
      availability: 'none',
      isEbook: false,
    }));
    if (options.language) {
      const language = options.language.toLowerCase();
      books = books.filter((book) => matchesLanguage(book, language));
    }
    if (options.sort === 'newest') {
      books.sort((a, b) => publicationYear(b.publishedDate) - publicationYear(a.publishedDate));
    }

    return {
      books,
      totalItems: books.length,
      nextStartIndex: books.length,
      hasMore: false,
      source: 'local',
    };
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
      const bookId = dbBook['book_id'] as number;
      return {
        googleId,
        dbBookId: bookId,
        title: dbBook['title'],
        author: dbBook['author_name'],
        description: dbBook['description'] ?? null,
        publishedDate: dbBook['publish_date'] ?? null,
        coverUrl: dbBook['cover_image_url'] ?? null,
        pageCount: dbBook['page_count'] ?? null,
        categories: dbBook['categories'] ?? [],
        ratingStats: await this.getRatingStats(bookId),
      };
    }

    // 2. Fallback to Google Books API
    const apiKey = process.env['GOOGLE_BOOKS_API_KEY'];
    const url = `https://www.googleapis.com/books/v1/volumes/${googleId}${apiKey ? `?key=${apiKey}` : ''}`;

    let res: Response;
    try {
      res = await fetchWithTimeout(url, 10_000);
    } catch {
      // Upstream (Google Books) unreachable — that's a gateway failure, not an
      // internal server fault. 502 keeps it out of the "500" bucket.
      throw new BadGatewayException('Could not reach the book provider. Please try again.');
    }

    if (!res.ok) {
      throw new NotFoundException('Book not found.');
    }

    const item = (await res.json()) as GoogleBookItem;
    const mapped = this.mapItem(item);
    // Not in our catalog yet, so no ReadTrack users have rated it.
    return { ...mapped, dbBookId: null, ratingStats: null };
  }

  // Aggregates the 1-5 star ratings ReadTrack users have given this book.
  // Runs with the admin client so it sees every rating (the user_books RLS
  // policy would otherwise hide other users' private rows from a direct query).
  private async getRatingStats(bookId: number): Promise<RatingStats> {
    const empty: RatingStats = {
      average: 0,
      total: 0,
      distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percent: 0 })),
    };

    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select('rating')
      .eq('book_id', bookId)
      .not('rating', 'is', null);

    if (error || !data?.length) return empty;

    const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star … index 4 = 5 stars
    let sum = 0;
    for (const row of data) {
      const r = row['rating'] as number;
      if (r >= 1 && r <= 5) {
        counts[r - 1]++;
        sum += r;
      }
    }

    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return empty;

    return {
      average: Math.round((sum / total) * 10) / 10,
      total,
      distribution: [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: counts[star - 1],
        percent: Math.round((counts[star - 1] / total) * 100),
      })),
    };
  }

  // Find-or-create a catalog book, SERVER-SIDE only. The browser is no longer
  // allowed to write to public.books (RLS), so adding a Google book to a shelf
  // or posting about it routes through here. Authoritative metadata comes from
  // Google Books; the client-supplied fields are only a fallback when Google is
  // unreachable. Runs with the admin client (bypasses RLS).
  async ensureBook(input: {
    googleId?: string;
    title?: string;
    author?: string;
    coverUrl?: string | null;
    description?: string | null;
  }): Promise<{ bookId: number }> {
    const admin = this.supabase.getAdmin();
    const googleId = (input.googleId ?? '').trim();
    if (!googleId) {
      throw new NotFoundException('googleId is required.');
    }

    const { data: existing } = await admin
      .from('books')
      .select('book_id')
      .eq('google_books_id', googleId)
      .maybeSingle();
    if (existing) return { bookId: existing['book_id'] as number };

    // Prefer authoritative Google data; fall back to whatever the client sent.
    let title = input.title?.trim() || '';
    let author = input.author?.trim() || '';
    let description = input.description ?? null;
    let coverUrl = input.coverUrl ?? null;
    let publishedDate: string | null = null;
    try {
      const key = process.env['GOOGLE_BOOKS_API_KEY'];
      const url = `https://www.googleapis.com/books/v1/volumes/${googleId}${key ? `?key=${key}` : ''}`;
      const res = await fetchWithTimeout(url, 10_000);
      if (res.ok) {
        const mapped = this.mapItem((await res.json()) as GoogleBookItem);
        title = mapped.title || title;
        author = mapped.author || author;
        description = mapped.description ?? description;
        coverUrl = mapped.coverUrl ?? coverUrl;
        publishedDate = mapped.publishedDate;
      }
    } catch {
      // Google unreachable — use the client-provided fallback fields.
    }

    const { data: inserted, error } = await admin
      .from('books')
      .insert({
        title: title || 'Untitled',
        author_name: author || 'Unknown Author',
        description,
        cover_image_url: coverUrl,
        google_books_id: googleId,
        publish_date: normalizePublishedDate(publishedDate),
      })
      .select('book_id')
      .single();

    if (error) {
      // Unique-violation race: another request inserted it first.
      const { data: again } = await admin
        .from('books')
        .select('book_id')
        .eq('google_books_id', googleId)
        .maybeSingle();
      if (again) return { bookId: again['book_id'] as number };
      throw error;
    }

    return { bookId: inserted['book_id'] as number };
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
      language: v.language ?? null,
      averageRating: v.averageRating ?? null,
      ratingsCount: v.ratingsCount ?? 0,
      availability: mapAvailability(item),
      isEbook:
        item.saleInfo?.isEbook === true ||
        item.accessInfo?.epub?.isAvailable === true ||
        item.accessInfo?.pdf?.isAvailable === true,
    };
  }
}

// The search box is advertised as "title, author, or ISBN", so the free-text
// query goes to Google unqualified — its default index covers title, author and
// subject. Qualifying every term with `intitle:` (as this used to) ANDed them
// all against the title alone, so an author-only query like "Colleen Hoover"
// matched nothing and silently fell through to the local-catalog fallback.
function buildProviderQuery(query: string, options: BookSearchOptions): string {
  // An ISBN identifies exactly one volume, so it wins outright — AND-ing it with
  // the free text could only narrow that single hit down to nothing.
  const typedIsbn = normalizeIsbn(query);
  if (typedIsbn) return `isbn:${typedIsbn}`;

  // The author filter has to be pushed down to Google as `inauthor:`. Scanning
  // pages of a generic result set and post-filtering on the author name found
  // almost nothing, because the author's books simply aren't in the first few
  // pages for a broad term: "dune" + herbert, "love" + austen and "it" + king
  // all came back empty. Quoted so multi-word names stay one term.
  const author = options.author?.trim();
  return [query.trim(), author ? `inauthor:"${author.replace(/"/g, '')}"` : '']
    .filter(Boolean)
    .join(' ');
}

// Accepts ISBN-10 (9 digits + digit or X check char) and ISBN-13, with the
// hyphens/spaces people paste from a copyright page.
function normalizeIsbn(value: string | null | undefined): string | null {
  const compact = (value ?? '').replace(/[\s-]/g, '');
  return /^(\d{9}[\dXx]|\d{13})$/.test(compact) ? compact.toUpperCase() : null;
}

function publicationYear(value: string | null): number {
  const year = Number(value?.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

function matchesLanguage(book: SearchedBook, language: string): boolean {
  if (book.language?.toLowerCase() !== language) return false;
  if (language !== 'ar') return true;

  const searchableText = [book.title, book.author].join(' ');
  return /[\u0600-\u06ff]/.test(searchableText);
}

function mapAvailability(item: GoogleBookItem): 'full' | 'preview' | 'none' {
  const viewability = item.accessInfo?.viewability;
  if (item.accessInfo?.publicDomain || viewability === 'ALL_PAGES') return 'full';
  if (viewability === 'PARTIAL' || viewability === 'SAMPLE_PAGES') return 'preview';
  return 'none';
}

// Google Books returns publishedDate as 'YYYY', 'YYYY-MM', or 'YYYY-MM-DD'.
// Normalize to a Postgres DATE ('YYYY-MM-DD') or null so the insert never fails.
function normalizePublishedDate(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`;
  if (/^\d{4}$/.test(value)) return `${value}-01-01`;
  return null;
}

// Google Books returns a transient 503 "Service temporarily unavailable" on a
// noticeable fraction of otherwise-valid requests. A single failure used to
// abandon the whole search and fall back to the local catalog, so the same
// query would show a full page of results one moment and "no results" the next.
// Retry 5xx (and network errors) a couple of times before giving up. 4xx —
// quota exhausted, bad key, malformed query — is not retried; it won't change.
async function fetchGoogleBooks(url: string): Promise<Response> {
  const backoffMs = [200, 500];
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetchWithTimeout(url, 10_000);
      if (res.status < 500 || attempt >= backoffMs.length) return res;
    } catch (err) {
      if (attempt >= backoffMs.length) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
