import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationsService } from './notifications.service';

@Injectable({ providedIn: 'root' })
export class LikesService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly notificationsService = inject(NotificationsService);

  togglePostLike(postId: number, userId: string, postOwnerId: string, currentlyLiked: boolean): Observable<void> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        if (currentlyLiked) {
          const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
          if (error) throw error;
          this.notificationsService.fireNotification(postOwnerId, userId, 'post_liked', postId, 'post');
        }
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  // Reviews support both like and dislike, so a single row per (review, user)
  // carries an is_like flag. Clicking the active reaction again clears it.
  toggleReviewReaction(
    userBookId: number,
    userId: string,
    reviewOwnerId: string,
    currentReaction: 'like' | 'dislike' | null,
    wantLike: boolean,
  ): Observable<void> {
    const want: 'like' | 'dislike' = wantLike ? 'like' : 'dislike';
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        if (currentReaction === want) {
          const { error } = await supabase
            .from('review_likes')
            .delete()
            .eq('user_book_id', userBookId)
            .eq('user_id', userId);
          if (error) throw error;
          return;
        }
        const { error } = await supabase
          .from('review_likes')
          .upsert({ user_book_id: userBookId, user_id: userId, is_like: wantLike }, { onConflict: 'user_book_id,user_id' });
        if (error) throw error;
        if (wantLike && currentReaction !== 'like') {
          this.notificationsService.fireNotification(reviewOwnerId, userId, 'review_liked', userBookId, 'review');
        }
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  toggleCommentLike(commentId: number, userId: string, commentOwnerId: string, currentlyLiked: boolean): Observable<void> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        if (currentlyLiked) {
          const { error } = await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: userId });
          if (error) throw error;
          this.notificationsService.fireNotification(commentOwnerId, userId, 'comment_liked', commentId, 'comment');
        }
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }
}
