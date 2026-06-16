import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly supabaseService = inject(SupabaseService);

  // Ensures the book exists in the catalog (client can insert — books RLS
  // allows it), then asks the backend to add it to the recipient's shelf and
  // notify them. The cross-user shelf write must go through the backend admin
  // client (user_books RLS forbids writing another user's row).
  // Returns `added: false` when the recipient already has the book.
  async recommendBook(
    googleBookId: string,
    bookTitle: string,
    bookAuthor: string,
    bookCover: string | null,
    _fromUserId: string,
    toUserId: string,
  ): Promise<{ added: boolean }> {
    const supabase = await this.supabaseService.getClient();
    const bookId = await this.ensureBookInDb(supabase, googleBookId, bookTitle, bookAuthor, bookCover);

    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const res = await fetch('/api/recommendations/friend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId, bookId }),
    });
    const payload = (await res.json().catch(() => ({}))) as { added?: boolean; message?: string };
    if (!res.ok) throw new Error(payload.message ?? 'Failed to recommend book.');
    return { added: payload.added ?? true };
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
