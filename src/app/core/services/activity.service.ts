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
  isLikedByMe: boolean;
  tags: string[];
  sentiment: string | null;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly supabaseService = inject(SupabaseService);

  // friendship_status is a static seed table; resolve the 'accepted' id once
  // instead of an extra round-trip on every feed load.
  private acceptedStatusIdPromise?: Promise<number | undefined>;

  private resolveAcceptedStatusId(): Promise<number | undefined> {
    this.acceptedStatusIdPromise ??= this.supabaseService.getClient().then(async (supabase) => {
      const { data } = await supabase
        .from('friendship_status')
        .select('status_id')
        .eq('status_name', 'accepted')
        .single();
      return data?.['status_id'] as number | undefined;
    }).catch(() => {
      this.acceptedStatusIdPromise = undefined;
      return undefined;
    });
    return this.acceptedStatusIdPromise;
  }

  getFriendActivity(userId: string, limit = 20): Observable<ActivityPost[]> {
    return from(this.loadFeed(userId, limit)).pipe(
      catchError((err) => throwError(() => err)),
    );
  }

  private async loadFeed(userId: string, limit: number): Promise<ActivityPost[]> {
    const supabase = await this.supabaseService.getClient();

    const acceptedId = await this.resolveAcceptedStatusId();

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

    const { data: posts, error } = await supabase
      .from('posts')
      .select('post_id, book_id, content, created_at, user_id, tags, sentiment')
      .in('user_id', feedUserIds)
      .neq('is_deleted', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!posts?.length) return [];

    const postIds = posts.map((p) => p['post_id'] as number);
    const authorIds = [...new Set(posts.map((p) => p['user_id'] as string))];
    const bookIds = [...new Set(posts.map((p) => p['book_id'] as number))];

    const [authorsRes, booksRes, likesRes, commentCountRes] = await Promise.all([
      supabase.from('users').select('id, name, profile_picture_url').in('id', authorIds),
      supabase.from('books').select('book_id, title, cover_image_url').in('book_id', bookIds),
      supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds).neq('is_deleted', true),
    ]);

    const authorMap = new Map((authorsRes.data ?? []).map((a) => [a['id'] as string, a]));
    const bookMap = new Map((booksRes.data ?? []).map((b) => [b['book_id'] as number, b]));

    const likeCountMap = new Map<number, number>();
    const likedPostIds = new Set<number>();
    (likesRes.data ?? []).forEach((l) => {
      const pid = l['post_id'] as number;
      likeCountMap.set(pid, (likeCountMap.get(pid) ?? 0) + 1);
      if (l['user_id'] === userId) likedPostIds.add(pid);
    });

    const commentCountMap = new Map<number, number>();
    (commentCountRes.data ?? []).forEach((c) => {
      const pid = c['post_id'] as number;
      commentCountMap.set(pid, (commentCountMap.get(pid) ?? 0) + 1);
    });

    return posts.map((p) => this.mapPost(p, authorMap, bookMap, likeCountMap, likedPostIds, commentCountMap));
  }

  deletePost(postId: number): Observable<void> {
    return from(
      this.supabaseService.getClient().then((supabase) =>
        supabase.from('posts').update({ is_deleted: true }).eq('post_id', postId)
          .then(({ error }) => { if (error) throw error; }),
      ),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  getTrendingPosts(currentUserId: string, limit = 20): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data: posts, error } = await supabase
          .from('posts')
          .select('post_id, book_id, content, created_at, user_id, tags, sentiment')
          .neq('is_deleted', true)
          .gte('created_at', since)
          .limit(100);

        if (error) throw error;
        if (!posts?.length) return [];

        // Trending shows posts from everyone, so hide private accounts that
        // aren't the viewer's friend (matches the community feed + profile gate).
        const allAuthorIds = [...new Set(posts.map((p) => p['user_id'] as string))];
        const hiddenPrivate = await this.getHiddenPrivateAuthorIds(currentUserId, allAuthorIds);
        const vposts = hiddenPrivate.size
          ? posts.filter((p) => !hiddenPrivate.has(p['user_id'] as string))
          : posts;
        if (!vposts.length) return [];

        const postIds = vposts.map((p) => p['post_id'] as number);
        const authorIds = [...new Set(vposts.map((p) => p['user_id'] as string))];
        const bookIds = [...new Set(vposts.map((p) => p['book_id'] as number))];

        const [authorsRes, booksRes, likesRes, commentCountRes] = await Promise.all([
          supabase.from('users').select('id, name, profile_picture_url').in('id', authorIds),
          supabase.from('books').select('book_id, title, cover_image_url').in('book_id', bookIds),
          supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
          supabase.from('comments').select('post_id').in('post_id', postIds).neq('is_deleted', true),
        ]);

        const authorMap = new Map((authorsRes.data ?? []).map((a) => [a['id'] as string, a]));
        const bookMap = new Map((booksRes.data ?? []).map((b) => [b['book_id'] as number, b]));

        const likeCountMap = new Map<number, number>();
        const likedPostIds = new Set<number>();
        (likesRes.data ?? []).forEach((l) => {
          const pid = l['post_id'] as number;
          likeCountMap.set(pid, (likeCountMap.get(pid) ?? 0) + 1);
          if (l['user_id'] === currentUserId) likedPostIds.add(pid);
        });

        const commentCountMap = new Map<number, number>();
        (commentCountRes.data ?? []).forEach((c) => {
          const pid = c['post_id'] as number;
          commentCountMap.set(pid, (commentCountMap.get(pid) ?? 0) + 1);
        });

        return vposts
          .map((p) => this.mapPost(p, authorMap, bookMap, likeCountMap, likedPostIds, commentCountMap))
          .sort((a, b) => b.likeCount - a.likeCount)
          .slice(0, limit);
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  // Author ids to hide from "everyone" views (trending): private accounts that
  // aren't the viewer's accepted friend (and aren't the viewer). Friendship RLS
  // scopes the friendship read to the viewer's own rows.
  private async getHiddenPrivateAuthorIds(viewerId: string, authorIds: string[]): Promise<Set<string>> {
    const hidden = new Set<string>();
    if (!authorIds.length) return hidden;
    const supabase = await this.supabaseService.getClient();
    const [privateRes, friendRes] = await Promise.all([
      supabase.from('users').select('id').in('id', authorIds).eq('is_private', true),
      supabase
        .from('friendship')
        .select('user_id1, user_id2, friendship_status(status_name)')
        .or(`user_id1.eq.${viewerId},user_id2.eq.${viewerId}`),
    ]);
    const friendSet = new Set(
      (friendRes.data ?? [])
        .filter((r) => ((r['friendship_status'] as unknown) as { status_name?: string } | null)?.status_name === 'accepted')
        .map((r) => (r['user_id1'] === viewerId ? (r['user_id2'] as string) : (r['user_id1'] as string))),
    );
    for (const r of privateRes.data ?? []) {
      const id = r['id'] as string;
      if (id !== viewerId && !friendSet.has(id)) hidden.add(id);
    }
    return hidden;
  }

  getUserPosts(targetUserId: string, currentUserId: string, limit = 10): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('post_id, book_id, content, created_at, user_id, tags, sentiment')
          .eq('user_id', targetUserId)
          .neq('is_deleted', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        if (!posts?.length) return [];

        const postIds = posts.map((p) => p['post_id'] as number);
        const bookIds = [...new Set(posts.map((p) => p['book_id'] as number))];

        const [authorRes, booksRes, likesRes, commentCountRes] = await Promise.all([
          supabase.from('users').select('id, name, profile_picture_url').eq('id', targetUserId).single(),
          supabase.from('books').select('book_id, title, cover_image_url').in('book_id', bookIds),
          supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
          supabase.from('comments').select('post_id').in('post_id', postIds).neq('is_deleted', true),
        ]);

        const authorMap = new Map(authorRes.data ? [[authorRes.data['id'] as string, authorRes.data]] : []);
        const bookMap = new Map((booksRes.data ?? []).map((b) => [b['book_id'] as number, b]));

        const likeCountMap = new Map<number, number>();
        const likedPostIds = new Set<number>();
        (likesRes.data ?? []).forEach((l) => {
          const pid = l['post_id'] as number;
          likeCountMap.set(pid, (likeCountMap.get(pid) ?? 0) + 1);
          if (l['user_id'] === currentUserId) likedPostIds.add(pid);
        });

        const commentCountMap = new Map<number, number>();
        (commentCountRes.data ?? []).forEach((c) => {
          const pid = c['post_id'] as number;
          commentCountMap.set(pid, (commentCountMap.get(pid) ?? 0) + 1);
        });

        return posts.map((p) => this.mapPost(p, authorMap, bookMap, likeCountMap, likedPostIds, commentCountMap));
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  getBookPosts(bookId: number, userId: string, limit = 20): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('post_id, book_id, content, created_at, user_id, tags, sentiment')
          .eq('book_id', bookId)
          .neq('is_deleted', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        if (!posts?.length) return [];

        const postIds = posts.map((p) => p['post_id'] as number);
        const authorIds = [...new Set(posts.map((p) => p['user_id'] as string))];

        const [authorsRes, bookRes, likesRes, commentCountRes] = await Promise.all([
          supabase.from('users').select('id, name, profile_picture_url').in('id', authorIds),
          supabase.from('books').select('book_id, title, cover_image_url').eq('book_id', bookId).single(),
          supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
          supabase.from('comments').select('post_id').in('post_id', postIds).neq('is_deleted', true),
        ]);

        const authorMap = new Map((authorsRes.data ?? []).map((a) => [a['id'] as string, a]));
        const bookMap = new Map(bookRes.data ? [[bookRes.data['book_id'] as number, bookRes.data]] : []);

        const likeCountMap = new Map<number, number>();
        const likedPostIds = new Set<number>();
        (likesRes.data ?? []).forEach((l) => {
          const pid = l['post_id'] as number;
          likeCountMap.set(pid, (likeCountMap.get(pid) ?? 0) + 1);
          if (l['user_id'] === userId) likedPostIds.add(pid);
        });

        const commentCountMap = new Map<number, number>();
        (commentCountRes.data ?? []).forEach((c) => {
          const pid = c['post_id'] as number;
          commentCountMap.set(pid, (commentCountMap.get(pid) ?? 0) + 1);
        });

        return posts.map((p) => this.mapPost(p, authorMap, bookMap, likeCountMap, likedPostIds, commentCountMap));
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  async getCommunityPosts(
    userId: string,
    tag?: string,
    page = 0,
    scope?: 'friends' | 'mine',
    bookId?: number,
  ): Promise<ActivityPost[]> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) return [];
    const params = new URLSearchParams({ page: String(page) });
    if (tag) params.set('tag', tag);
    if (scope) params.set('scope', scope);
    if (bookId) params.set('bookId', String(bookId));
    const res = await fetch(`/api/community/posts?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json() as Promise<ActivityPost[]>;
  }

  async getCommunityTrendingPosts(userId: string): Promise<ActivityPost[]> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) return [];
    const res = await fetch('/api/community/posts?trending=true', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return res.json() as Promise<ActivityPost[]>;
  }

  async createCommunityPost(
    userId: string,
    bookId: number,
    content: string,
    tags: string[],
  ): Promise<ActivityPost> {
    const session = await this.supabaseService.getCurrentSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');
    const res = await fetch('/api/community/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, content, tags }),
    });
    const body = await res.json() as ActivityPost & { message?: string };
    if (!res.ok) {
      // Attach the HTTP status so the UI can show a translated message for a
      // moderation rejection (422) vs a generic failure.
      const err = new Error(body.message ?? 'Failed to post') as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return body;
  }

  private mapPost(
    raw: Record<string, unknown>,
    authorMap: Map<string, Record<string, unknown>>,
    bookMap: Map<number, Record<string, unknown>>,
    likeCountMap: Map<number, number>,
    likedPostIds: Set<number>,
    commentCountMap: Map<number, number>,
  ): ActivityPost {
    const pid = raw['post_id'] as number;
    const book = bookMap.get(raw['book_id'] as number);
    const author = authorMap.get(raw['user_id'] as string);
    return {
      id: pid,
      bookId: raw['book_id'] as number,
      bookTitle: (book?.['title'] as string) ?? 'Unknown Book',
      bookCover: (book?.['cover_image_url'] as string) ?? '',
      content: raw['content'] as string,
      userId: raw['user_id'] as string,
      userName: (author?.['name'] as string) ?? 'Reader',
      userAvatar: (author?.['profile_picture_url'] as string) ?? null,
      createdAt: raw['created_at'] as string,
      likeCount: likeCountMap.get(pid) ?? 0,
      commentCount: commentCountMap.get(pid) ?? 0,
      isLikedByMe: likedPostIds.has(pid),
      tags: (raw['tags'] as string[]) ?? [],
      sentiment: (raw['sentiment'] as string) ?? null,
    };
  }
}
