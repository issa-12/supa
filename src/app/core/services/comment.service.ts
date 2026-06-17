import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

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

    // Hide comments from users in a block relationship with the viewer (either
    // direction), matching the community feed's block filtering.
    const blocked = await this.getBlockedUserIds(currentUserId);
    const visibleRows = blocked.size
      ? rows.filter((r) => !blocked.has(r['user_id'] as string))
      : rows;
    if (!visibleRows.length) return [];

    const authorIds = [...new Set(visibleRows.map((r) => r['user_id'] as string))];
    const commentIds = visibleRows.map((r) => r['comment_id'] as number);

    const [authorsRes, likesRes, myLikesRes, friendIds] = await Promise.all([
      supabase.from('users').select('id, name, profile_picture_url, is_private').in('id', authorIds),
      supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
      supabase.from('comment_likes').select('comment_id').in('comment_id', commentIds).eq('user_id', currentUserId),
      this.getFriendIds(currentUserId),
    ]);

    const authorMap = new Map((authorsRes.data ?? []).map((a) => [a['id'] as string, a]));

    // Hide comments from private accounts that aren't the viewer's friend (and
    // aren't the viewer themselves) — matches the community/profile privacy gate.
    const friendSet = new Set(friendIds);
    const privateRows = visibleRows.filter((r) => {
      const author = authorMap.get(r['user_id'] as string);
      const uid = r['user_id'] as string;
      if (author?.['is_private'] && uid !== currentUserId && !friendSet.has(uid)) return false;
      return true;
    });
    if (!privateRows.length) return [];

    const likeCountMap = new Map<number, number>();
    (likesRes.data ?? []).forEach((l) => {
      const cid = l['comment_id'] as number;
      likeCountMap.set(cid, (likeCountMap.get(cid) ?? 0) + 1);
    });

    const likedCommentIds = new Set((myLikesRes.data ?? []).map((l) => l['comment_id'] as number));

    const flat: Comment[] = privateRows.map((r) => {
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

  // Ids of users in a block relationship with the viewer (either direction).
  // Friendship RLS lets the client read only its own rows, so this is scoped.
  private async getBlockedUserIds(currentUserId: string): Promise<Set<string>> {
    const blocked = new Set<string>();
    if (!currentUserId) return blocked;
    const supabase = await this.supabaseService.getClient();
    const { data } = await supabase
      .from('friendship')
      .select('user_id1, user_id2, friendship_status(status_name)')
      .or(`user_id1.eq.${currentUserId},user_id2.eq.${currentUserId}`);

    (data ?? []).forEach((r) => {
      const statusName = ((r['friendship_status'] as unknown) as { status_name?: string } | null)?.status_name;
      if (statusName === 'blocked') {
        const other = r['user_id1'] === currentUserId ? r['user_id2'] : r['user_id1'];
        if (other) blocked.add(other as string);
      }
    });
    return blocked;
  }

  // The viewer's accepted friends (scoped by friendship RLS to own rows).
  private async getFriendIds(currentUserId: string): Promise<string[]> {
    if (!currentUserId) return [];
    const supabase = await this.supabaseService.getClient();
    const { data } = await supabase
      .from('friendship')
      .select('user_id1, user_id2, friendship_status(status_name)')
      .or(`user_id1.eq.${currentUserId},user_id2.eq.${currentUserId}`);

    return (data ?? [])
      .filter((r) => ((r['friendship_status'] as unknown) as { status_name?: string } | null)?.status_name === 'accepted')
      .map((r) => (r['user_id1'] === currentUserId ? (r['user_id2'] as string) : (r['user_id1'] as string)));
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

  // Comment creation goes through the moderated backend endpoint (same policy
  // as posts: profanity/abuse blocked with 422). The backend computes the
  // authoritative depth from the parent and fires the comment notification.
  // The depth arg here is only a fast client-side guard for a nicer message.
  addComment(
    postId: number,
    _userId: string,
    content: string,
    parentCommentId: number | null = null,
    depth = 0,
  ): Observable<Comment> {
    if (depth < 0 || depth > 3) {
      return from(Promise.reject(new Error('Maximum reply depth reached.')));
    }
    return from(
      (async () => {
        const session = await this.supabaseService.getCurrentSession();
        const token = session?.access_token;
        if (!token) throw new Error('Not authenticated');

        const res = await fetch('/api/community/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ postId, content, parentCommentId }),
        });
        const body = (await res.json().catch(() => ({}))) as Comment & { message?: string };
        if (!res.ok) throw new Error(body.message ?? 'Failed to post comment.');
        return body as Comment;
      })(),
    ).pipe(catchError((err) => throwError(() => err)));
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
