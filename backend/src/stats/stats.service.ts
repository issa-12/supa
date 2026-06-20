import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type StatsScope = 'personal' | 'friends' | 'community';
export type StatsStatus = 'all' | 'read' | 'currently_reading' | 'want_to_read';

export interface AnalyticsFilters {
  from: string | null;
  to: string | null;
  scope: StatsScope;
  status: StatsStatus;
}

export interface AnalyticsSummary {
  booksTracked: number;
  booksCompleted: number;
  averageRating: number | null;
  reviewsWritten: number;
}

export interface AnalyticsBucket {
  key: string;
  label: string;
  count: number;
}

export interface AnalyticsTopBook {
  rank: number;
  title: string;
  author: string;
  coverUrl: string | null;
  googleBooksId: string | null;
  count: number;
}

export interface AnalyticsTopReader {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  booksRead: number;
}

export interface AnalyticsTrendingGenre {
  name: string;
  count: number;
  percentage: number;
}

export interface CommunitySummary {
  posts: number;
  comments: number;
  reactions: number;
  reviews: number;
}

export interface RankedBookMetric {
  rank: number;
  title: string;
  author: string;
  googleBooksId: string | null;
  value: number;
  secondaryValue?: number;
}

export interface CommunityContributor {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  contributions: number;
}

export interface AnalyticsCsvRow {
  reader: string;
  title: string;
  author: string;
  status: string;
  rating: number | null;
  hasReview: boolean;
  addedAt: string;
  completedAt: string | null;
  activityAt: string;
}

export interface AnalyticsDashboard {
  filters: AnalyticsFilters;
  generatedAt: string;
  refreshAfterSeconds: number;
  availableFrom: string | null;
  summary: AnalyticsSummary;
  completionTimeline: AnalyticsBucket[];
  statusDistribution: AnalyticsBucket[];
  ratingDistribution: AnalyticsBucket[];
  topBooks: AnalyticsTopBook[];
  topReaders: AnalyticsTopReader[];
  trendingGenres: AnalyticsTrendingGenre[];
  communitySummary: CommunitySummary;
  mostDiscussedBooks: RankedBookMetric[];
  mostReviewedBooks: RankedBookMetric[];
  highestRatedBooks: RankedBookMetric[];
  sentimentDistribution: AnalyticsBucket[];
  topContributors: CommunityContributor[];
  rows: AnalyticsCsvRow[];
}

interface ShelfRow {
  userId: string;
  bookId: number;
  status: string;
  rating: number | null;
  reviewText: string | null;
  addedAt: string;
  updatedAt: string | null;
  readAt: string | null;
  activityAt: string;
  title: string;
  author: string;
  coverUrl: string | null;
  googleBooksId: string | null;
}

@Injectable()
export class StatsService {
  constructor(private readonly supabase: SupabaseService) {}

  async verifyUser(token: string): Promise<string> {
    const userId = await this.supabase.getVerifiedUserId(token);
    if (!userId) throw new UnauthorizedException('Invalid or expired session.');
    return userId;
  }

  parseFilters(
    from?: string,
    to?: string,
    scope?: string,
    status?: string,
  ): AnalyticsFilters {
    const fromDate = from ? parseDateOnly(from, false) : null;
    const toDate = to ? parseDateOnly(to, true) : null;

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('"from" must be on or before "to".');
    }

    const normalizedScope: StatsScope =
      scope === 'friends' || scope === 'community' ? scope : 'personal';
    const allowedStatuses: StatsStatus[] = [
      'all',
      'read',
      'currently_reading',
      'want_to_read',
    ];
    const normalizedStatus = allowedStatuses.includes(status as StatsStatus)
      ? (status as StatsStatus)
      : 'all';

    return {
      from: fromDate?.toISOString() ?? null,
      to: toDate?.toISOString() ?? null,
      scope: normalizedScope,
      status: normalizedStatus,
    };
  }

  async getDashboard(
    userId: string,
    filters: AnalyticsFilters,
  ): Promise<AnalyticsDashboard> {
    const scopedUserIds = await this.getScopedUserIds(userId, filters.scope);
    const rows = await this.getShelfRows(scopedUserIds, filters);
    const userProfiles = await this.getUserProfiles(rows.map((row) => row.userId));

    const ratings = rows
      .map((row) => row.rating)
      .filter((rating): rating is number => rating !== null);
    const completedRows = rows.filter((row) => row.status === 'read');
    const availableFrom = earliestActivityDate(rows);
    const communityInsights = await this.getCommunityInsights(
      scopedUserIds,
      filters,
      rows,
      userProfiles,
    );

    return {
      filters,
      generatedAt: new Date().toISOString(),
      refreshAfterSeconds: 60,
      availableFrom,
      summary: {
        booksTracked: rows.length,
        booksCompleted: completedRows.length,
        averageRating: ratings.length
          ? roundOne(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
          : null,
        reviewsWritten: rows.filter((row) => Boolean(row.reviewText?.trim())).length,
      },
      completionTimeline: buildCompletionTimeline(completedRows, filters, availableFrom),
      statusDistribution: buildStatusDistribution(rows),
      ratingDistribution: buildRatingDistribution(rows),
      topBooks: buildTopBooks(rows),
      topReaders: buildTopReaders(rows, userProfiles),
      trendingGenres: await this.getTrendingGenres(scopedUserIds),
      ...communityInsights,
      // Raw rows are export data. Never expose another user's shelf records,
      // even when the visible dashboard is aggregated across friends/all users.
      rows: rows
        .filter((row) => row.userId === userId)
        .map((row) => ({
          reader: userProfiles.get(row.userId)?.name ?? 'Reader',
          title: row.title,
          author: row.author,
          status: row.status,
          rating: row.rating,
          hasReview: Boolean(row.reviewText?.trim()),
          addedAt: row.addedAt,
          completedAt: row.readAt,
          activityAt: row.activityAt,
        }))
        .sort((a, b) => b.activityAt.localeCompare(a.activityAt)),
    };
  }

  private async getScopedUserIds(
    userId: string,
    scope: StatsScope,
  ): Promise<string[] | null> {
    if (scope === 'personal') return [userId];
    if (scope === 'community') {
      const { data, error } = await this.supabase
        .getAdmin()
        .from('users')
        .select('id')
        .or(`is_private.eq.false,is_private.is.null,id.eq.${userId}`);
      if (error) throw new InternalServerErrorException(error.message);
      return [...new Set((data ?? []).map((user) => user['id'] as string))];
    }

    const admin = this.supabase.getAdmin();
    const { data: accepted, error: statusError } = await admin
      .from('friendship_status')
      .select('status_id')
      .eq('status_name', 'accepted')
      .single();
    if (statusError || !accepted) {
      throw new InternalServerErrorException('Accepted friendship status is missing.');
    }

    const { data, error } = await admin
      .from('friendship')
      .select('user_id1, user_id2')
      .eq('status_id', accepted['status_id'])
      .or(`user_id1.eq.${userId},user_id2.eq.${userId}`);
    if (error) throw new InternalServerErrorException(error.message);

    return (data ?? []).map((friendship) =>
      friendship['user_id1'] === userId
        ? (friendship['user_id2'] as string)
        : (friendship['user_id1'] as string),
    );
  }

  private async getShelfRows(
    scopedUserIds: string[] | null,
    filters: AnalyticsFilters,
  ): Promise<ShelfRow[]> {
    if (scopedUserIds?.length === 0) return [];

    let query = this.supabase
      .getAdmin()
      .from('user_books')
      .select(
        'user_id, book_id, rating, review_text, added_at, updated_at, read_at, books(title, author_name, cover_image_url, google_books_id), reading_statuses(status_name)',
      );

    if (scopedUserIds) query = query.in('user_id', scopedUserIds);
    if (filters.status !== 'all') {
      const { data: statusRow, error: statusError } = await this.supabase
        .getAdmin()
        .from('reading_statuses')
        .select('status_id')
        .eq('status_name', filters.status)
        .single();
      if (statusError || !statusRow) {
        throw new InternalServerErrorException(`Reading status "${filters.status}" is missing.`);
      }
      query = query.eq('status_id', statusRow['status_id']);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    const fromMs = filters.from ? new Date(filters.from).getTime() : null;
    const toMs = filters.to ? new Date(filters.to).getTime() : null;
    return (data ?? [])
      .map((raw): ShelfRow | null => {
        const statusRelation = relation(raw['reading_statuses']);
        const bookRelation = relation(raw['books']);
        const status = statusRelation?.['status_name'] as string | undefined;
        if (!status || !bookRelation) return null;

        const readAt = (raw['read_at'] as string | null) ?? null;
        const updatedAt = (raw['updated_at'] as string | null) ?? null;
        const addedAt = raw['added_at'] as string;
        // Legacy rows may pre-date read_at maintenance. For completed books,
        // updated_at is the best available fallback until the migration backfill.
        const activityAt =
          status === 'read' ? readAt ?? updatedAt ?? addedAt : updatedAt ?? addedAt;
        const activityMs = new Date(activityAt).getTime();
        if (
          !Number.isFinite(activityMs) ||
          (fromMs !== null && activityMs < fromMs) ||
          (toMs !== null && activityMs > toMs)
        ) {
          return null;
        }

        return {
          userId: raw['user_id'] as string,
          bookId: raw['book_id'] as number,
          status,
          rating: (raw['rating'] as number | null) ?? null,
          reviewText: (raw['review_text'] as string | null) ?? null,
          addedAt,
          updatedAt,
          readAt: readAt ?? (status === 'read' ? updatedAt ?? addedAt : null),
          activityAt,
          title: bookRelation['title'] as string,
          author: bookRelation['author_name'] as string,
          coverUrl: (bookRelation['cover_image_url'] as string | null) ?? null,
          googleBooksId: (bookRelation['google_books_id'] as string | null) ?? null,
        };
      })
      .filter((row): row is ShelfRow => row !== null);
  }

  private async getUserProfiles(
    userIds: string[],
  ): Promise<Map<string, { name: string; avatarUrl: string | null }>> {
    const uniqueIds = [...new Set(userIds)];
    if (!uniqueIds.length) return new Map();
    const { data, error } = await this.supabase
      .getAdmin()
      .from('users')
      .select('id, name, profile_picture_url')
      .in('id', uniqueIds);
    if (error) throw new InternalServerErrorException(error.message);
    return new Map(
      (data ?? []).map((user) => [
        user['id'] as string,
        {
          name: (user['name'] as string | null) ?? 'Reader',
          avatarUrl: (user['profile_picture_url'] as string | null) ?? null,
        },
      ]),
    );
  }

  private async getTrendingGenres(
    scopedUserIds: string[] | null,
  ): Promise<AnalyticsTrendingGenre[]> {
    if (scopedUserIds?.length === 0) return [];
    let query = this.supabase
      .getAdmin()
      .from('user_genres')
      .select('user_id, genres(genre_name)');
    if (scopedUserIds) query = query.in('user_id', scopedUserIds);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const genre = relation(row['genres']);
      const name = genre?.['genre_name'] as string | undefined;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
      }));
  }

  private async getCommunityInsights(
    scopedUserIds: string[] | null,
    filters: AnalyticsFilters,
    shelfRows: ShelfRow[],
    knownProfiles: Map<string, { name: string; avatarUrl: string | null }>,
  ): Promise<{
    communitySummary: CommunitySummary;
    mostDiscussedBooks: RankedBookMetric[];
    mostReviewedBooks: RankedBookMetric[];
    highestRatedBooks: RankedBookMetric[];
    sentimentDistribution: AnalyticsBucket[];
    topContributors: CommunityContributor[];
  }> {
    if (scopedUserIds?.length === 0) {
      return emptyCommunityInsights();
    }

    const admin = this.supabase.getAdmin();
    let postsQuery = admin
      .from('posts')
      .select('post_id, book_id, user_id, sentiment, created_at')
      .neq('is_deleted', true)
      .or('moderation_status.is.null,moderation_status.neq.rejected');
    if (scopedUserIds) postsQuery = postsQuery.in('user_id', scopedUserIds);
    if (filters.from) postsQuery = postsQuery.gte('created_at', filters.from);
    if (filters.to) postsQuery = postsQuery.lte('created_at', filters.to);
    const { data: posts, error: postsError } = await postsQuery;
    if (postsError) throw new InternalServerErrorException(postsError.message);

    const bookIds = [...new Set((posts ?? []).map((post) => post['book_id'] as number))];

    let commentsQuery = admin
      .from('comments')
      .select('comment_id, post_id, user_id, created_at, posts(book_id)')
      .neq('is_deleted', true);
    let postLikesQuery = admin
      .from('post_likes')
      .select('post_id, user_id, created_at');
    let commentLikesQuery = admin
      .from('comment_likes')
      .select('comment_id, user_id, created_at');
    if (scopedUserIds) {
      commentsQuery = commentsQuery.in('user_id', scopedUserIds);
      postLikesQuery = postLikesQuery.in('user_id', scopedUserIds);
      commentLikesQuery = commentLikesQuery.in('user_id', scopedUserIds);
    }
    if (filters.from) {
      commentsQuery = commentsQuery.gte('created_at', filters.from);
      postLikesQuery = postLikesQuery.gte('created_at', filters.from);
      commentLikesQuery = commentLikesQuery.gte('created_at', filters.from);
    }
    if (filters.to) {
      commentsQuery = commentsQuery.lte('created_at', filters.to);
      postLikesQuery = postLikesQuery.lte('created_at', filters.to);
      commentLikesQuery = commentLikesQuery.lte('created_at', filters.to);
    }
    const [commentsResult, postLikesResult, commentLikesResult] = await Promise.all([
      commentsQuery,
      postLikesQuery,
      commentLikesQuery,
    ]);
    if (commentsResult.error) {
      throw new InternalServerErrorException(commentsResult.error.message);
    }
    if (postLikesResult.error) {
      throw new InternalServerErrorException(postLikesResult.error.message);
    }
    if (commentLikesResult.error) {
      throw new InternalServerErrorException(commentLikesResult.error.message);
    }
    const comments = commentsResult.data ?? [];
    const postLikes = postLikesResult.data ?? [];
    const commentLikes = commentLikesResult.data ?? [];

    const reviewRows = shelfRows.filter((row) => Boolean(row.reviewText?.trim()));
    let reviewLikesQuery = admin
      .from('review_likes')
      .select('user_book_id, user_id, is_like, created_at');
    if (scopedUserIds) reviewLikesQuery = reviewLikesQuery.in('user_id', scopedUserIds);
    if (filters.from) reviewLikesQuery = reviewLikesQuery.gte('created_at', filters.from);
    if (filters.to) reviewLikesQuery = reviewLikesQuery.lte('created_at', filters.to);
    const reviewLikesResult = await reviewLikesQuery;
    if (reviewLikesResult.error) {
      throw new InternalServerErrorException(reviewLikesResult.error.message);
    }
    const reviewLikes = reviewLikesResult.data ?? [];
    const reviewedBookIds = reviewRows.map((row) => row.bookId);
    const commentedBookIds = comments
      .map((comment) => relation(comment['posts'])?.['book_id'] as number | undefined)
      .filter((bookId): bookId is number => Boolean(bookId));
    const allBookIds = [...new Set([...bookIds, ...commentedBookIds, ...reviewedBookIds])];
    const bookMap = await this.getBookMap(allBookIds);

    const discussionCounts = new Map<number, number>();
    for (const post of posts ?? []) {
      const bookId = post['book_id'] as number;
      discussionCounts.set(bookId, (discussionCounts.get(bookId) ?? 0) + 1);
    }
    for (const comment of comments) {
      const post = relation(comment['posts']);
      const bookId = post?.['book_id'] as number | undefined;
      if (bookId) discussionCounts.set(bookId, (discussionCounts.get(bookId) ?? 0) + 1);
    }

    const reviewCounts = countByBook(reviewRows);
    const ratingGroups = new Map<number, number[]>();
    for (const row of shelfRows) {
      if (row.rating === null) continue;
      const ratings = ratingGroups.get(row.bookId) ?? [];
      ratings.push(row.rating);
      ratingGroups.set(row.bookId, ratings);
    }

    const sentimentCounts = new Map<string, number>();
    for (const post of posts ?? []) {
      const sentiment = (post['sentiment'] as string | null) ?? 'unclassified';
      sentimentCounts.set(sentiment, (sentimentCounts.get(sentiment) ?? 0) + 1);
    }

    const contributionCounts = new Map<string, number>();
    for (const post of posts ?? []) increment(contributionCounts, post['user_id'] as string);
    for (const comment of comments) increment(contributionCounts, comment['user_id'] as string);
    for (const review of reviewRows) increment(contributionCounts, review.userId);
    const contributorIds = [...contributionCounts.keys()];
    const missingIds = contributorIds.filter((id) => !knownProfiles.has(id));
    const profiles =
      missingIds.length > 0
        ? new Map([...knownProfiles, ...(await this.getUserProfiles(missingIds))])
        : knownProfiles;

    return {
      communitySummary: {
        posts: posts?.length ?? 0,
        comments: comments.length,
        reactions: postLikes.length + commentLikes.length + reviewLikes.length,
        reviews: reviewRows.length,
      },
      mostDiscussedBooks: rankBookCounts(discussionCounts, bookMap),
      mostReviewedBooks: rankBookCounts(reviewCounts, bookMap),
      highestRatedBooks: [...ratingGroups.entries()]
        .map(([bookId, ratings]) => ({
          bookId,
          average: roundOne(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length),
          ratingCount: ratings.length,
        }))
        .sort((a, b) => b.average - a.average || b.ratingCount - a.ratingCount)
        .slice(0, 5)
        .map((entry, index) => {
          const book = bookMap.get(entry.bookId);
          return {
            rank: index + 1,
            title: book?.title ?? 'Unknown book',
            author: book?.author ?? 'Unknown author',
            googleBooksId: book?.googleBooksId ?? null,
            value: entry.average,
            secondaryValue: entry.ratingCount,
          };
        }),
      sentimentDistribution: ['positive', 'neutral', 'mixed', 'negative', 'unclassified']
        .map((key) => ({
          key,
          label: key === 'unclassified' ? 'Not classified' : capitalize(key),
          count: sentimentCounts.get(key) ?? 0,
        }))
        .filter((bucket) => bucket.count > 0),
      topContributors: [...contributionCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, contributions], index) => ({
          rank: index + 1,
          userId,
          name: profiles.get(userId)?.name ?? 'Reader',
          avatarUrl: profiles.get(userId)?.avatarUrl ?? null,
          contributions,
        })),
    };
  }

  private async getBookMap(
    bookIds: number[],
  ): Promise<Map<number, { title: string; author: string; googleBooksId: string | null }>> {
    if (!bookIds.length) return new Map();
    const { data, error } = await this.supabase
      .getAdmin()
      .from('books')
      .select('book_id, title, author_name, google_books_id')
      .in('book_id', bookIds);
    if (error) throw new InternalServerErrorException(error.message);
    return new Map(
      (data ?? []).map((book) => [
        book['book_id'] as number,
        {
          title: book['title'] as string,
          author: book['author_name'] as string,
          googleBooksId: (book['google_books_id'] as string | null) ?? null,
        },
      ]),
    );
  }
}

function parseDateOnly(value: string, endOfDay: boolean): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('Dates must use YYYY-MM-DD.');
  }
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date.');
  return date;
}

function relation(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) ?? null;
  return (value as Record<string, unknown> | null) ?? null;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildCompletionTimeline(
  rows: ShelfRow[],
  filters: AnalyticsFilters,
  availableFrom: string | null,
): AnalyticsBucket[] {
  const completedDates = rows
    .map((row) => row.readAt)
    .filter((date): date is string => Boolean(date))
    .map((date) => new Date(date));
  if (!completedDates.length) return [];

  const firstRecorded = availableFrom
    ? new Date(availableFrom)
    : new Date(Math.min(...completedDates.map((date) => date.getTime())));
  const requestedFrom = filters.from ? new Date(filters.from) : firstRecorded;
  const from = requestedFrom < firstRecorded ? firstRecorded : requestedFrom;
  const today = new Date();
  const requestedTo = filters.to ? new Date(filters.to) : today;
  const to = requestedTo > today ? today : requestedTo;
  if (from > to) return [];
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
  const granularity = days <= 45 ? 'day' : days <= 180 ? 'week' : 'month';
  const buckets = new Map<string, AnalyticsBucket>();

  for (const row of rows) {
    if (!row.readAt) continue;
    const date = new Date(row.readAt);
    const key = bucketKey(date, granularity);
    const current = buckets.get(key) ?? {
      key,
      label: bucketLabel(date, granularity),
      count: 0,
    };
    current.count++;
    buckets.set(key, current);
  }

  const cursor = new Date(from);
  while (cursor <= to) {
    const key = bucketKey(cursor, granularity);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: bucketLabel(cursor, granularity), count: 0 });
    }
    if (granularity === 'day') cursor.setDate(cursor.getDate() + 1);
    else if (granularity === 'week') cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1, 1);
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function bucketKey(date: Date, granularity: 'day' | 'week' | 'month'): string {
  const normalized = new Date(date);
  if (granularity === 'week') {
    const day = normalized.getDay();
    normalized.setDate(normalized.getDate() - ((day + 6) % 7));
  }
  if (granularity === 'month') normalized.setDate(1);
  return [
    normalized.getFullYear(),
    String(normalized.getMonth() + 1).padStart(2, '0'),
    granularity === 'month' ? '01' : String(normalized.getDate()).padStart(2, '0'),
  ].join('-');
}

function bucketLabel(date: Date, granularity: 'day' | 'week' | 'month'): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: granularity === 'month' ? undefined : 'numeric',
    year: granularity === 'month' ? '2-digit' : undefined,
  }).format(date);
}

function buildStatusDistribution(rows: ShelfRow[]): AnalyticsBucket[] {
  const labels: Record<string, string> = {
    read: 'Read',
    currently_reading: 'Currently reading',
    want_to_read: 'Want to read',
    recommended_by_friend: 'Friend recommendations',
  };
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);
}

function buildRatingDistribution(rows: ShelfRow[]): AnalyticsBucket[] {
  return [1, 2, 3, 4, 5].map((rating) => ({
    key: String(rating),
    label: `${rating} star${rating === 1 ? '' : 's'}`,
    count: rows.filter((row) => row.rating === rating).length,
  }));
}

function buildTopBooks(rows: ShelfRow[]): AnalyticsTopBook[] {
  const counts = new Map<
    number,
    Omit<AnalyticsTopBook, 'rank' | 'count'> & { count: number }
  >();
  for (const row of rows) {
    const current = counts.get(row.bookId) ?? {
      title: row.title,
      author: row.author,
      coverUrl: row.coverUrl,
      googleBooksId: row.googleBooksId,
      count: 0,
    };
    current.count++;
    counts.set(row.bookId, current);
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title))
    .slice(0, 8)
    .map((book, index) => ({ ...book, rank: index + 1 }));
}

function buildTopReaders(
  rows: ShelfRow[],
  profiles: Map<string, { name: string; avatarUrl: string | null }>,
): AnalyticsTopReader[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.status === 'read') {
      counts.set(row.userId, (counts.get(row.userId) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, booksRead], index) => ({
      rank: index + 1,
      userId,
      name: profiles.get(userId)?.name ?? 'Reader',
      avatarUrl: profiles.get(userId)?.avatarUrl ?? null,
      booksRead,
    }));
}

function earliestActivityDate(rows: ShelfRow[]): string | null {
  if (!rows.length) return null;
  return rows.reduce(
    (earliest, row) => (row.activityAt < earliest ? row.activityAt : earliest),
    rows[0].activityAt,
  );
}

function emptyCommunityInsights() {
  return {
    communitySummary: { posts: 0, comments: 0, reactions: 0, reviews: 0 },
    mostDiscussedBooks: [],
    mostReviewedBooks: [],
    highestRatedBooks: [],
    sentimentDistribution: [],
    topContributors: [],
  };
}

function increment(counts: Map<string, number>, key: string | null | undefined): void {
  if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
}

function countByBook(rows: ShelfRow[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of rows) counts.set(row.bookId, (counts.get(row.bookId) ?? 0) + 1);
  return counts;
}

function rankBookCounts(
  counts: Map<number, number>,
  books: Map<number, { title: string; author: string; googleBooksId: string | null }>,
): RankedBookMetric[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([bookId, value], index) => ({
      rank: index + 1,
      title: books.get(bookId)?.title ?? 'Unknown book',
      author: books.get(bookId)?.author ?? 'Unknown author',
      googleBooksId: books.get(bookId)?.googleBooksId ?? null,
      value,
    }));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
