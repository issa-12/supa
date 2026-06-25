import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface LikerUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  username: string | null;
  isFriend: boolean;
  isPending: boolean;
}
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

  private async fetchLikers(table: 'post_likes' | 'comment_likes', idCol: string, id: number, currentUserId: string): Promise<LikerUser[]> {
    const supabase = await this.supabaseService.getClient();

    const { data: likes } = await supabase
      .from(table).select(`user_id, created_at`).eq(idCol, id)
      .order('created_at', { ascending: false }).limit(100);
    if (!likes?.length) return [];

    const userIds = likes.map(l => l['user_id'] as string);

    const [usersRes, friendshipsRes, statusRes, pendingRes] = await Promise.all([
      supabase.from('users').select('id, name, profile_picture_url, username').in('id', userIds),
      supabase.from('friendship').select('user_id1, user_id2, status_id, requester_id')
        .or(`user_id1.eq.${currentUserId},user_id2.eq.${currentUserId}`),
      supabase.from('friendship_status').select('status_id').eq('status_name', 'accepted').single(),
      supabase.from('friendship_status').select('status_id').eq('status_name', 'pending').single(),
    ]);

    const acceptedId = statusRes.data?.['status_id'];
    const pendingStatusId = pendingRes.data?.['status_id'];
    const friendIds = new Set<string>();
    const pendingIds = new Set<string>();
    for (const f of friendshipsRes.data ?? []) {
      const other = (f['user_id1'] === currentUserId ? f['user_id2'] : f['user_id1']) as string;
      if (!userIds.includes(other)) continue;
      if (f['status_id'] === acceptedId) friendIds.add(other);
      else if (f['status_id'] === pendingStatusId && f['requester_id'] === currentUserId) pendingIds.add(other);
    }

    const userMap = new Map((usersRes.data ?? []).map(u => [u['id'] as string, u]));
    return userIds.map(uid => {
      const u = userMap.get(uid) as Record<string, unknown> | undefined;
      return {
        userId: uid,
        name: (u?.['name'] as string) ?? 'Reader',
        avatarUrl: (u?.['profile_picture_url'] as string) ?? null,
        username: (u?.['username'] as string) ?? null,
        isFriend: friendIds.has(uid),
        isPending: pendingIds.has(uid),
      };
    });
  }

  getPostLikers(postId: number, currentUserId: string): Promise<LikerUser[]> {
    return this.fetchLikers('post_likes', 'post_id', postId, currentUserId);
  }

  getCommentLikers(commentId: number, currentUserId: string): Promise<LikerUser[]> {
    return this.fetchLikers('comment_likes', 'comment_id', commentId, currentUserId);
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
