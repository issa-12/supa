import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { NotificationsService } from './notifications.service';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly notificationsService = inject(NotificationsService);

  async recommendBook(
    googleBookId: string,
    bookTitle: string,
    bookAuthor: string,
    bookCover: string | null,
    fromUserId: string,
    toUserId: string,
  ): Promise<void> {
    const supabase = await this.supabaseService.getClient();
    const bookId = await this.ensureBookInDb(supabase, googleBookId, bookTitle, bookAuthor, bookCover);
    await this.notificationsService.fireNotification(toUserId, fromUserId, 'book_recommended', bookId, 'book');
  }

  private async ensureBookInDb(
    supabase: SupabaseClient,
    googleId: string,
    title: string,
    author: string,
    coverUrl: string | null,
  ): Promise<number> {
    const { data: existing } = await supabase
      .from('books')
      .select('book_id')
      .eq('google_books_id', googleId)
      .maybeSingle();

    if (existing) return existing['book_id'] as number;

    const { data: inserted, error } = await supabase
      .from('books')
      .insert({ title, author_name: author, cover_image_url: coverUrl, google_books_id: googleId })
      .select('book_id')
      .single();

    if (error || !inserted) throw error ?? new Error('Failed to save book');
    return inserted['book_id'] as number;
  }
}
