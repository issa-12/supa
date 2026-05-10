import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, throwError } from 'rxjs';
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
  addedAt: string;
  readAt: string | null;
  updatedAt: string | null;
  book?: Book;
  status?: { id: number; name: string };
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

  getFeaturedBook(): Observable<Book> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('books')
          .select('*')
          .limit(1)
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data || data.length === 0) {
              throw new Error('No featured book found');
            }
            return this.mapBook(data[0]);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getContinueReadingBooks(userId: string): Observable<UserBook[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('user_books')
          .select('*, book:books(*), status:reading_statuses(*)')
          .eq('user_id', userId)
          .eq('status_id', 1)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapUserBook(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getRecommendedBooks(userId: string, limit: number = 6): Observable<Book[]> {
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

  private mapUserBook(raw: any): UserBook {
    return {
      id: raw.user_book_id,
      bookId: raw.book_id,
      userId: raw.user_id,
      statusId: raw.status_id,
      rating: raw.rating,
      note: raw.note,
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
