import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface TopBook {
  rank: number;
  title: string;
  author: string;
  coverUrl: string | null;
  googleBooksId: string | null;
  addCount: number;
}

export interface TrendingGenre {
  name: string;
  count: number;
  percentage: number;
}

export interface TopReader {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  booksRead: number;
}

export interface MonthlyPace {
  month: string;
  count: number;
}

@Injectable()
export class StatsService {
  private readStatusId: number | null = null;

  constructor(private readonly supabase: SupabaseService) {}

  async verifyUser(token: string): Promise<string> {
    const { data, error } = await this.supabase.getAdmin().auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid or expired session.');
    return data.user.id;
  }

  private async getReadStatusId(): Promise<number> {
    if (this.readStatusId !== null) return this.readStatusId;
    const { data, error } = await this.supabase
      .getAdmin()
      .from('reading_statuses')
      .select('status_id')
      .eq('status_name', 'read')
      .single();
    if (error || !data) {
      throw new InternalServerErrorException(
        'reading_statuses seed missing "read" row — run the day-1 migration.',
      );
    }
    this.readStatusId = data['status_id'] as number;
    return this.readStatusId;
  }

  async getTopBooks(period: 'week' | 'month'): Promise<TopBook[]> {
    const days = period === 'week' ? 7 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Server-side aggregation (see 20260616000001_stats_rpc.sql).
    const { data, error } = await this.supabase
      .getAdmin()
      .rpc('stats_top_books', { since });

    if (error) {
      console.warn('[Stats] stats_top_books RPC failed, falling back to JS:', error.message);
      return this.getTopBooksFallback(since);
    }

    return (data ?? []).map((row: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      title: row['title'] as string,
      author: row['author_name'] as string,
      coverUrl: (row['cover_image_url'] as string) ?? null,
      googleBooksId: (row['google_books_id'] as string) ?? null,
      addCount: Number(row['add_count']),
    }));
  }

  // Pre-RPC implementation, retained as a fallback if the migration that
  // creates stats_top_books has not been applied in a given environment.
  private async getTopBooksFallback(since: string): Promise<TopBook[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select('book_id, books(book_id, title, author_name, cover_image_url, google_books_id), reading_statuses(status_name)')
      .gte('updated_at', since);

    if (error) throw new InternalServerErrorException(error.message);

    const counts = new Map<number, { book: Record<string, unknown>; count: number }>();
    for (const row of data ?? []) {
      // Skip pending friend recommendations — they're auto-added, not chosen.
      const status = row['reading_statuses'] as unknown as { status_name?: string } | null;
      if (status?.status_name === 'recommended_by_friend') continue;
      const book = row['books'] as unknown as Record<string, unknown> | null;
      if (!book) continue;
      const id = book['book_id'] as number;
      if (!counts.has(id)) counts.set(id, { book, count: 0 });
      counts.get(id)!.count++;
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((entry, i) => ({
        rank: i + 1,
        title: entry.book['title'] as string,
        author: entry.book['author_name'] as string,
        coverUrl: (entry.book['cover_image_url'] as string) ?? null,
        googleBooksId: (entry.book['google_books_id'] as string) ?? null,
        addCount: entry.count,
      }));
  }

  async getTrendingGenres(): Promise<TrendingGenre[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .rpc('stats_trending_genres');

    if (error) {
      console.warn('[Stats] stats_trending_genres RPC failed, falling back to JS:', error.message);
      return this.getTrendingGenresFallback();
    }

    return (data ?? []).map((row: Record<string, unknown>) => {
      const count = Number(row['cnt']);
      const total = Number(row['total']);
      return {
        name: row['genre_name'] as string,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  }

  private async getTrendingGenresFallback(): Promise<TrendingGenre[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_genres')
      .select('genres(genre_name)');

    if (error) throw new InternalServerErrorException(error.message);

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const g = row['genres'] as unknown as { genre_name: string } | null;
      if (g?.genre_name) counts.set(g.genre_name, (counts.get(g.genre_name) ?? 0) + 1);
    }

    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }

  async getTopReaders(): Promise<TopReader[]> {
    const statusId = await this.getReadStatusId();

    const { data, error } = await this.supabase
      .getAdmin()
      .rpc('stats_top_readers', { read_status_id: statusId });

    if (error) {
      console.warn('[Stats] stats_top_readers RPC failed, falling back to JS:', error.message);
      return this.getTopReadersFallback(statusId);
    }

    return (data ?? []).map((row: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      userId: row['user_id'] as string,
      name: (row['name'] as string) ?? 'Reader',
      avatarUrl: (row['profile_picture_url'] as string) ?? null,
      booksRead: Number(row['books_read']),
    }));
  }

  private async getTopReadersFallback(statusId: number): Promise<TopReader[]> {
    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select('user_id')
      .eq('status_id', statusId);

    if (error) throw new InternalServerErrorException(error.message);

    // Count books read per user
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const id = row['user_id'] as string;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    const topUserIds = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    if (!topUserIds.length) return [];

    // Fetch user profiles separately (user_books has no FK to public.users)
    const { data: users } = await this.supabase
      .getAdmin()
      .from('users')
      .select('id, name, profile_picture_url')
      .in('id', topUserIds);

    const userMap = new Map(
      (users ?? []).map((u) => [u['id'] as string, u as Record<string, unknown>]),
    );

    return topUserIds.map((userId, i) => {
      const user = userMap.get(userId);
      return {
        rank: i + 1,
        userId,
        name: (user?.['name'] as string) ?? 'Reader',
        avatarUrl: (user?.['profile_picture_url'] as string) ?? null,
        booksRead: counts.get(userId) ?? 0,
      };
    });
  }

  async getReadingPace(userId: string): Promise<MonthlyPace[]> {
    const statusId = await this.getReadStatusId();
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1).toISOString();

    const { data, error } = await this.supabase
      .getAdmin()
      .from('user_books')
      .select('updated_at')
      .eq('user_id', userId)
      .eq('status_id', statusId)
      .gte('updated_at', startOfYear);

    if (error) throw new InternalServerErrorException(error.message);

    const monthCounts = new Array(12).fill(0) as number[];
    for (const row of data ?? []) {
      const month = new Date(row['updated_at'] as string).getMonth();
      monthCounts[month]++;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthCounts.map((count, i) => ({ month: months[i], count }));
  }
}
