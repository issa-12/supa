import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ActivityPost {
  id: number;
  bookId: number;
  bookTitle: string;
  bookCover: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly supabaseService = inject(SupabaseService);

  getFriendActivity(userId: string, limit = 20): Observable<ActivityPost[]> {
    return from(this.loadFeed(userId, limit)).pipe(
      catchError((err) => throwError(() => err)),
    );
  }

  private async loadFeed(userId: string, limit: number): Promise<ActivityPost[]> {
    const supabase = await this.supabaseService.getClient();

    // Get accepted status ID
    const { data: statusRow } = await supabase
      .from('friendship_status')
      .select('status_id')
      .eq('status_name', 'accepted')
      .single();

    const acceptedId = statusRow?.['status_id'] as number | undefined;

    // Get accepted friend IDs
    let friendIds: string[] = [];
    if (acceptedId) {
      const { data: friendships } = await supabase
        .from('friendship')
        .select('user_id1, user_id2')
        .or(`user_id1.eq.${userId},user_id2.eq.${userId}`)
        .eq('status_id', acceptedId);

      friendIds = (friendships ?? []).map((f) =>
        f['user_id1'] === userId ? (f['user_id2'] as string) : (f['user_id1'] as string),
      );
    }

    const feedUserIds = [...new Set([userId, ...friendIds])];

    // Get posts — no PostgREST join, fetch books separately to avoid FK-name fragility
    const { data: posts, error } = await supabase
      .from('posts')
      .select('post_id, book_id, content, created_at, user_id')
      .in('user_id', feedUserIds)
      .neq('is_deleted', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!posts?.length) return [];

    // Batch-fetch author data
    const authorIds = [...new Set(posts.map((p) => p['user_id'] as string))];
    const { data: authors } = await supabase
      .from('users')
      .select('id, name, profile_picture_url')
      .in('id', authorIds);

    const authorMap = new Map((authors ?? []).map((a) => [a['id'], a]));

    // Batch-fetch book data
    const bookIds = [...new Set(posts.map((p) => p['book_id'] as number))];
    const { data: books } = await supabase
      .from('books')
      .select('book_id, title, cover_image_url')
      .in('book_id', bookIds);

    const bookMap = new Map((books ?? []).map((b) => [b['book_id'] as number, b]));

    return posts.map((p) => this.mapPost(p, authorMap, bookMap));
  }

  createPost(userId: string, bookId: number, content: string): Observable<ActivityPost> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data, error } = await supabase
          .from('posts')
          .insert({ user_id: userId, book_id: bookId, content, is_deleted: false })
          .select('post_id, book_id, content, created_at, user_id')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create post');

        const [authorRes, bookRes] = await Promise.all([
          supabase.from('users').select('id, name, profile_picture_url').eq('id', userId).single(),
          supabase.from('books').select('book_id, title, cover_image_url').eq('book_id', bookId).single(),
        ]);

        const authorMap = new Map(authorRes.data ? [[authorRes.data['id'], authorRes.data]] : []);
        const bookMap = new Map(bookRes.data ? [[bookRes.data['book_id'] as number, bookRes.data]] : []);
        return this.mapPost(data, authorMap, bookMap);
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  deletePost(postId: number): Observable<void> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('posts')
          .update({ is_deleted: true })
          .eq('post_id', postId)
          .then(({ error }) => {
            if (error) throw error;
          }),
      ),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  getBookPosts(bookId: number, limit = 20): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('post_id, book_id, content, created_at, user_id')
          .eq('book_id', bookId)
          .neq('is_deleted', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        if (!posts?.length) return [];

        const authorIds = [...new Set(posts.map((p) => p['user_id'] as string))];
        const { data: authors } = await supabase
          .from('users')
          .select('id, name, profile_picture_url')
          .in('id', authorIds);

        const authorMap = new Map((authors ?? []).map((a) => [a['id'], a]));

        const { data: book } = await supabase
          .from('books')
          .select('book_id, title, cover_image_url')
          .eq('book_id', bookId)
          .single();

        const bookMap = new Map(book ? [[book['book_id'] as number, book]] : []);
        return posts.map((p) => this.mapPost(p, authorMap, bookMap));
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  private mapPost(
    raw: Record<string, unknown>,
    authorMap: Map<string, Record<string, unknown>>,
    bookMap: Map<number, Record<string, unknown>>,
  ): ActivityPost {
    const book = bookMap.get(raw['book_id'] as number);
    const author = authorMap.get(raw['user_id'] as string);
    return {
      id: raw['post_id'] as number,
      bookId: raw['book_id'] as number,
      bookTitle: (book?.['title'] as string) ?? 'Unknown Book',
      bookCover: (book?.['cover_image_url'] as string) ?? '',
      content: raw['content'] as string,
      userId: raw['user_id'] as string,
      userName: (author?.['name'] as string) ?? 'Reader',
      userAvatar: (author?.['profile_picture_url'] as string) ?? null,
      createdAt: raw['created_at'] as string,
      likeCount: 0,
      commentCount: 0,
    };
  }
}
