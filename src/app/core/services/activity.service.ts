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
  userAvatar: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly supabaseService = inject(SupabaseService);

  getFriendActivity(userId: string, limit: number = 10): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('posts')
          .select(`
            post_id,
            book_id,
            content,
            created_at,
            user_id,
            book:books(title, cover_image_url)
          `)
          .order('created_at', { ascending: false })
          .limit(limit)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapActivityPost(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  getBookPosts(bookId: number, limit: number = 20): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('posts')
          .select(`
            post_id,
            book_id,
            content,
            created_at,
            user_id,
            book:books(title, cover_image_url)
          `)
          .eq('book_id', bookId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map((item) => this.mapActivityPost(item));
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  createPost(userId: string, bookId: number, content: string): Observable<ActivityPost> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase
          .from('posts')
          .insert({
            user_id: userId,
            book_id: bookId,
            content,
            created_at: new Date().toISOString(),
          })
          .select(`
            post_id,
            book_id,
            content,
            created_at,
            user_id,
            book:books(title, cover_image_url)
          `)
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            if (!data) throw new Error('Failed to create post');
            return this.mapActivityPost(data);
          })
      )
    ).pipe(catchError((error) => throwError(() => error)));
  }

  private mapActivityPost(raw: any): ActivityPost {
    return {
      id: raw.post_id,
      bookId: raw.book_id,
      bookTitle: raw.book?.title || 'Unknown Book',
      bookCover: raw.book?.cover_image_url || '',
      content: raw.content,
      userId: raw.user_id,
      userName: 'Friend',
      userAvatar: '',
      createdAt: raw.created_at,
      likeCount: 0,
      commentCount: 0,
    };
  }
}
