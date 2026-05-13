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

    const { data: statusRow } = await supabase
      .from('friendship_status')
      .select('status_id')
      .eq('status_name', 'accepted')
      .single();

    const acceptedId = statusRow?.['status_id'] as number | undefined;

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
      .select('post_id, book_id, content, created_at, user_id')
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

        const authorMap = new Map(authorRes.data ? [[authorRes.data['id'] as string, authorRes.data]] : []);
        const bookMap = new Map(bookRes.data ? [[bookRes.data['book_id'] as number, bookRes.data]] : []);
        return this.mapPost(data, authorMap, bookMap, new Map(), new Set(), new Map());
      }),
    ).pipe(catchError((err) => throwError(() => err)));
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
          .select('post_id, book_id, content, created_at, user_id')
          .neq('is_deleted', true)
          .gte('created_at', since)
          .limit(100);

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
          if (l['user_id'] === currentUserId) likedPostIds.add(pid);
        });

        const commentCountMap = new Map<number, number>();
        (commentCountRes.data ?? []).forEach((c) => {
          const pid = c['post_id'] as number;
          commentCountMap.set(pid, (commentCountMap.get(pid) ?? 0) + 1);
        });

        return posts
          .map((p) => this.mapPost(p, authorMap, bookMap, likeCountMap, likedPostIds, commentCountMap))
          .sort((a, b) => b.likeCount - a.likeCount)
          .slice(0, limit);
      }),
    ).pipe(catchError((err) => throwError(() => err)));
  }

  getUserPosts(targetUserId: string, currentUserId: string, limit = 10): Observable<ActivityPost[]> {
    return from(
      this.supabaseService.getClient().then(async (supabase) => {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('post_id, book_id, content, created_at, user_id')
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
          .select('post_id, book_id, content, created_at, user_id')
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
    };
  }
}
