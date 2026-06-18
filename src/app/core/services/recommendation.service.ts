import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BookService } from './book.service';

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly bookService = inject(BookService);

  // Ensures the book exists in the catalog (server-side, via the backend — the
  // browser can't write to public.books), then asks the backend to add it to
  // the recipient's shelf and notify them. The cross-user shelf write must go
  // through the backend admin client (user_books RLS forbids writing another
  // user's row). Returns `added: false` when the recipient already has the book.
  async recommendBook(
    googleBookId: string,
    bookTitle: string,
    bookAuthor: string,
    bookCover: string | null,
    _fromUserId: string,
    toUserId: string,
  ): Promise<{ added: boolean }> {
    const bookId = await this.bookService.ensureBookViaApi({
      googleId: googleBookId, title: bookTitle, author: bookAuthor, coverUrl: bookCover,
    });

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
}
