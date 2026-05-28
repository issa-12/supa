import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { NotificationsService } from './notifications.service';

export interface Comment {
  id: number;
  postId: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  content: string;
  createdAt: string;
  depth: number;
  parentCommentId: number | null;
  likeCount: number;
  isLikedByMe: boolean;
  replies: Comment[];
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly notificationsService = inject(NotificationsService);

  getComments(postId: number, currentUserId: string): Observable<Comment[]> {
    return from(this.loadComments(postId, currentUserId)).pipe(
      catchError((err) => throwError(() => err)),
    );
  }

  private async loadComments(postId: number, currentUserId: string): Promise<Comment[]> {
    const supabase = await this.supabaseService.getClient();

    const { data: rows, error } = await supabase
      .from('comments')
      .select('comment_id, post_id, user_id, content, created_at, depth, parent_comment_id')
      .eq('post_id', postId)
      .neq('is_deleted', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!rows?.length) return [];

    const authorIds = [...new Set(rows.map((r) => r['user_id'] as string))];
    const commentIds = rows.map((r) => r['comment_id'] as number);

    const [authorsRes, likesRes, myLikesRes] = await Promise.all([
      supabase.from('users').select('id, name, profile_picture_url').in('id', authorIds),
      supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
      supabase.from('comment_likes').select('comment_id').in('comment_id', commentIds).eq('user_id', currentUserId),
    ]);

    const authorMap = new Map((authorsRes.data ?? []).map((a) => [a['id'] as string, a]));

    const likeCountMap = new Map<number, number>();
    (likesRes.data ?? []).forEach((l) => {
      const cid = l['comment_id'] as number;
      likeCountMap.set(cid, (likeCountMap.get(cid) ?? 0) + 1);
    });

    const likedCommentIds = new Set((myLikesRes.data ?? []).map((l) => l['comment_id'] as number));

    const flat: Comment[] = rows.map((r) => {
      const author = authorMap.get(r['user_id'] as string);
      return {
        id: r['comment_id'] as number,
        postId: r['post_id'] as number,
        userId: r['user_id'] as string,
        userName: (author?.['name'] as string) ?? 'Reader',
        userAvatar: (author?.['profile_picture_url'] as string) ?? null,
        content: r['content'] as string,
        createdAt: r['created_at'] as string,
        depth: (r['depth'] as number) ?? 0,
        parentCommentId: (r['parent_comment_id'] as number) ?? null,
        likeCount: likeCountMap.get(r['comment_id'] as number) ?? 0,
        isLikedByMe: likedCommentIds.has(r['comment_id'] as number),
        replies: [],
      };
    });

    return this.buildTree(flat);
  }

  private buildTree(flat: Comment[]): Comment[] {
    const map = new Map(flat.map((c) => [c.id, c]));
    const roots: Comment[] = [];
    for (const c of flat) {
      if (c.parentCommentId === null) {
        roots.push(c);
      } else {
        const parent = map.get(c.parentCommentId);
        if (parent) parent.replies.push(c);
      }
    }
    return roots;
  }

  addComment(
    postId: number,
    userId: string,
    content: string,
    parentCommentId: number | null = null,
    depth = 0,
  ): Observable<Comment> {
    // The DB has a CHECK (depth >= 0 AND depth <= 3); validate up front
    // so we return a user-friendly error instead of a Postgres 500.
    if (depth < 0 || depth > 3) {
      return from(Promise.reject(new Error('Maximum reply depth reached.')));
    }
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data, error } = await supabase
          .from('comments')
          .insert({ post_id: postId, user_id: userId, content, parent_comment_id: parentCommentId, depth, is_deleted: false })
          .select('comment_id, post_id, user_id, content, created_at, depth, parent_comment_id')
          .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create comment');

        // Fire notification to post owner (top-level comment) or to the
        // parent commenter (reply). Fire-and-forget; never blocks UI.
        void this.fireCommentNotification(supabase, postId, userId, parentCommentId);

        const { data: author } = await supabase
          .from('users').select('id, name, profile_picture_url').eq('id', userId).single();

        return {
          id: data['comment_id'] as number,
          postId: data['post_id'] as number,
          userId: data['user_id'] as string,
          userName: (author?.['name'] as string) ?? 'Reader',
          userAvatar: (author?.['profile_picture_url'] as string) ?? null,
          content: data['content'] as string,
          createdAt: data['created_at'] as string,
          depth: (data['depth'] as number) ?? 0,
          parentCommentId: (data['parent_comment_id'] as number) ?? null,
          likeCount: 0,
          isLikedByMe: false,
          replies: [],
        } as Comment;
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  private async fireCommentNotification(
    supabase: Awaited<ReturnType<SupabaseService['getClient']>>,
    postId: number,
    actorId: string,
    parentCommentId: number | null,
  ): Promise<void> {
    try {
      if (parentCommentId) {
        const { data: parent } = await supabase
          .from('comments').select('user_id').eq('comment_id', parentCommentId).maybeSingle();
        const recipient = parent?.['user_id'] as string | undefined;
        if (recipient) {
          await this.notificationsService.fireNotification(
            recipient, actorId, 'comment_replied', parentCommentId, 'comment',
          );
        }
        return;
      }
      const { data: post } = await supabase
        .from('posts').select('user_id').eq('post_id', postId).maybeSingle();
      const recipient = post?.['user_id'] as string | undefined;
      if (recipient) {
        await this.notificationsService.fireNotification(
          recipient, actorId, 'post_commented', postId, 'post',
        );
      }
    } catch {
      // never block comment creation
    }
  }

  deleteComment(commentId: number): Observable<void> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase.from('comments').update({ is_deleted: true }).eq('comment_id', commentId)
          .then(({ error }) => { if (error) throw error; }),
      ),
    ).pipe(catchError((err) => throwError(() => err)));
  }
}
