import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Book {
  id: number;
  googleBooksId: string | null;
  title: string;
  author: string;
  description: string | null;
  publishDate: string | null;
  coverUrl: string | null;
}

export interface GoogleBook {
  googleId: string;
  title: string;
  author: string;
  description: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  categories: string[];
}

export interface UserBook {
  id: number;
  bookId: number;
  userId: string;
  statusId: number;
  rating: number | null;
  note: string | null;
  reviewText: string | null;
  currentPage: number | null;
  totalPages: number | null;
  addedAt: string;
  readAt: string | null;
  updatedAt: string | null;
  book?: Book;
  status?: { id: number; name: string };
}

export interface CommunityReview {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  rating: number | null;
  reviewText: string;
}

export interface ReadingStatus {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly supabaseService = inject(SupabaseService);

  getFeaturedBook(): Observable<Book | null> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('books')
          .select('*')
          .limit(1)
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) return null;
            return this.mapBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getContinueReadingBooks(userId: string): Observable<UserBook[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        // Resolve the status_id for 'currently_reading' dynamically
        const { data: status } = await supabase
          .from('reading_statuses')
          .select('status_id')
          .eq('status_name', 'currently_reading')
          .maybeSingle();

        const statusId = status?.['status_id'] ?? 3;

        return supabase
          .from('user_books')
          .select('*, book:books(*), status:reading_statuses(*)')
          .eq('user_id', userId)
          .eq('status_id', statusId)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapUserBook(item));
          });
      })
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getUserShelf(userId: string): Observable<UserBook[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .select('*, book:books(*), status:reading_statuses(*)')
          .eq('user_id', userId)
          .order('added_at', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapUserBook(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getUserBookByGoogleId(userId: string, googleBooksId: string): Observable<UserBook | null> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .select('*, book:books(*), status:reading_statuses(*)')
          .eq('user_id', userId)
          .then(({ data, error }) => {
            if (error) throw error;
            const match = (data || []).find(
              (ub) => ub.book?.google_books_id === googleBooksId,
            );
            return match ? this.mapUserBook(match) : null;
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  changeShelfStatus(userBookId: number, statusId: number): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ status_id: statusId, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Failed to change status');
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  setRating(userBookId: number, rating: number): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) throw new Error('Failed to rate book');
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  removeFromShelf(userBookId: number): Observable<void> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .delete()
          .eq('user_book_id', userBookId)
          .then(({ error }) => {
            if (error) throw error;
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getRecommendedBooks(userId: string, limit: number = 6): Observable<Book[]> {
    if (!userId) return of([]);

    return from(
      (async () => {
        const session = await this.supabaseService.getCurrentSession();
        const token = session?.access_token;
        if (!token) return [];

        const res = await fetch(`/api/recommendations/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return [];

        const payload = (await res.json()) as {
          books?: Array<{
            dbBookId: number | null;
            googleBooksId: string | null;
            title: string;
            author: string;
            description: string | null;
            coverUrl: string | null;
            reason: string;
          }>;
        };

        return (payload.books ?? []).slice(0, limit).map((b) => ({
          id: b.dbBookId ?? 0,
          googleBooksId: b.googleBooksId,
          title: b.title,
          author: b.author,
          description: b.description,
          publishDate: null,
          coverUrl: b.coverUrl,
        }));
      })()
    ).pipe(catchError((err) => { console.error('[BookService] getRecommendedBooks failed:', err); return of([]); }));
  }

  getTrendingBooks(limit: number = 6): Observable<Book[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('books')
          .select('*')
          .limit(limit)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapBook(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getUserBooksByRating(
    userId: string,
    minRating: number,
    maxRating: number
  ): Observable<UserBook[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .select('*, book:books(*), status:reading_statuses(*)')
          .eq('user_id', userId)
          .gte('rating', minRating)
          .lte('rating', maxRating)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapUserBook(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getUserBooksByStatus(userId: string, statusName: string, limit = 10): Observable<UserBook[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data: statusRow } = await supabase
          .from('reading_statuses')
          .select('status_id')
          .eq('status_name', statusName)
          .single();

        const statusId = statusRow?.['status_id'] as number | undefined;
        if (!statusId) return [];

        const { data, error } = await supabase
          .from('user_books')
          .select('*, book:books(*), status:reading_statuses(*)')
          .eq('user_id', userId)
          .eq('status_id', statusId)
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return (data ?? []).map((item) => this.mapUserBook(item));
      }),
    ).pipe(catchError((error) => throwError(() => error)));
  }

  async searchBooks(query: string): Promise<GoogleBook[]> {
    const params = new URLSearchParams({ q: query, maxResults: '20' });
    const res = await fetch(`/api/books/search?${params}`);
    const payload = await res.json() as { books?: GoogleBook[]; message?: string };

    if (!res.ok) {
      throw new Error(payload.message ?? 'Search failed.');
    }

    return payload.books ?? [];
  }

  async addGoogleBookToShelf(
    book: GoogleBook,
    userId: string,
    statusId: number,
  ): Promise<void> {
    const supabase = await this.supabaseService.getClient();

    // Find existing book or insert new one
    let bookId: number;
    const { data: existing } = await supabase
      .from('books')
      .select('book_id')
      .eq('google_books_id', book.googleId)
      .maybeSingle();

    if (existing) {
      bookId = existing['book_id'] as number;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('books')
        .insert({
          title: book.title,
          author_name: book.author,
          description: book.description,
          publish_date: book.publishedDate,
          cover_image_url: book.coverUrl,
          google_books_id: book.googleId,
        })
        .select('book_id')
        .single();

      if (insertErr || !inserted) throw insertErr ?? new Error('Failed to save book.');
      bookId = inserted['book_id'] as number;
    }

    // Upsert user_books (handles re-adding with a different status)
    const { error: shelfErr } = await supabase
      .from('user_books')
      .upsert(
        {
          user_id: userId,
          book_id: bookId,
          status_id: statusId,
          added_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,book_id' },
      );

    if (shelfErr) throw shelfErr;
  }

  getReadingStatuses(): Observable<ReadingStatus[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('reading_statuses')
          .select('*')
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => ({
              id: item.status_id,
              name: item.status_name,
            }));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  addBookToReadingList(
    userId: string,
    bookId: number,
    statusId: number = 1
  ): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .insert({
            user_id: userId,
            book_id: bookId,
            status_id: statusId,
            added_at: new Date().toISOString(),
          })
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) {
              throw new Error('Failed to add book');
            }
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  updateBookStatus(
    userBookId: number,
    statusId: number
  ): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ status_id: statusId, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) {
              throw new Error('Failed to update book status');
            }
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  rateBook(userBookId: number, rating: number): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) {
              throw new Error('Failed to rate book');
            }
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  private mapBook(raw: any): Book {
    return {
      id: raw.book_id,
      googleBooksId: raw.google_books_id ?? null,
      title: raw.title,
      author: raw.author_name,
      description: raw.description,
      publishDate: raw.publish_date,
      coverUrl: raw.cover_image_url,
    };
  }

  updateProgress(userBookId: number, currentPage: number, totalPages: number | null): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ current_page: currentPage, total_pages: totalPages, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data?.length) throw new Error('Failed to update progress');
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  saveNote(userBookId: number, note: string): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ note, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data?.length) throw new Error('Failed to save note');
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  saveReview(userBookId: number, reviewText: string): Observable<UserBook> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .update({ review_text: reviewText, updated_at: new Date().toISOString() })
          .eq('user_book_id', userBookId)
          .select('*, book:books(*), status:reading_statuses(*)')
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data?.length) throw new Error('Failed to save review');
            return this.mapUserBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  async getCommunityReviews(bookId: number, currentUserId: string): Promise<CommunityReview[]> {
    const supabase = await this.supabaseService.getClient();

    const { data: reviews } = await supabase
      .from('user_books')
      .select('user_id, rating, review_text')
      .eq('book_id', bookId)
      .not('review_text', 'is', null)
      .neq('user_id', currentUserId);

    if (!reviews?.length) return [];

    const userIds = reviews.map((r) => r['user_id'] as string);
    const { data: users } = await supabase
      .from('users')
      .select('id, name, profile_picture_url')
      .in('id', userIds);

    const userMap = new Map((users ?? []).map((u) => [u['id'] as string, u]));

    return reviews
      .filter((r) => r['review_text'])
      .map((r) => {
        const u = userMap.get(r['user_id'] as string);
        return {
          userId: r['user_id'] as string,
          userName: (u?.['name'] as string) ?? 'Reader',
          avatarUrl: (u?.['profile_picture_url'] as string) ?? null,
          rating: r['rating'] as number | null,
          reviewText: r['review_text'] as string,
        };
      });
  }

  private mapUserBook(raw: any): UserBook {
    return {
      id: raw.user_book_id,
      bookId: raw.book_id,
      userId: raw.user_id,
      statusId: raw.status_id,
      rating: raw.rating,
      note: raw.note ?? null,
      reviewText: raw.review_text ?? null,
      currentPage: raw.current_page ?? null,
      totalPages: raw.total_pages ?? null,
      addedAt: raw.added_at,
      readAt: raw.read_at,
      updatedAt: raw.updated_at,
      book: raw.book ? this.mapBook(raw.book) : undefined,
      status: raw.status
        ? { id: raw.status.status_id, name: raw.status.status_name }
        : undefined,
    };
  }
}
