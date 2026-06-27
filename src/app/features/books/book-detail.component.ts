import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService, RealtimeSubscription } from '../../core/services/supabase.service';
import { BookService, UserBook, GoogleBook, CommunityReview } from '../../core/services/book.service';
import { FriendshipService, FriendUser } from '../../core/services/friendship.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { LikesService } from '../../core/services/likes.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { TranslationService, BOOK_DETAIL_COPY, COMMUNITY_COPY, LanguageCode, GenreNamePipe } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timeAgo } from '../../core/util/time-ago';
import { TopNavComponent } from '../home/components/top-nav.component';

interface RatingBucket {
  star: number;
  count: number;
  percent: number;
}

interface RatingStats {
  average: number;
  total: number;
  distribution: RatingBucket[];
}

interface BookDetail {
  googleId: string;
  dbBookId: number | null;
  title: string;
  author: string;
  description: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  categories: string[];
  ratingStats: RatingStats | null;
}

const SHELF_STATUSES = [
  { name: 'currently_reading', label: '', icon: '📖' },
  { name: 'want_to_read', label: '', icon: '📚' },
  { name: 'read', label: '', icon: '✓' },
];

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, GenreNamePipe, TopNavComponent],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.scss',
})
export class BookDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supabaseService = inject(SupabaseService);
  private readonly bookService = inject(BookService);
  private readonly friendshipService = inject(FriendshipService);
  private readonly recommendationService = inject(RecommendationService);
  private readonly likesService = inject(LikesService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return BOOK_DETAIL_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => {
      this.lang = l;
      SHELF_STATUSES[0].label = this.copy.currentlyReadingStatusLabel;
      SHELF_STATUSES[1].label = this.copy.wantToReadStatusLabel;
      SHELF_STATUSES[2].label = this.copy.alreadyReadStatusLabel;
    });
  }

  book: BookDetail | null = null;
  descriptionText = '';   // book.description with HTML stripped (Google Books returns markup)
  userBook: UserBook | null = null;
  isLoading = true;
  error: string | null = null;

  hoverRating = 0;
  savingRating = false;
  showStatusDropdown = false;
  savingStatus = false;
  addingToShelf = false;

  showRecommendPicker = false;
  friends: FriendUser[] = [];
  recommendingToId: string | null = null;
  recommendFeedback: { userId: string; success: boolean; alreadyHad?: boolean } | null = null;

  note = '';
  savedNote = '';
  editingNote = false;
  noteSaving = false;
  noteSaved = false;

  reviewText = '';
  savedReview = '';
  editingReview = false;
  reviewSaving = false;

  currentUserName: string | null = null;
  currentUserAvatar: string | null = null;

  myReviewUserBookId: number | null = null;
  myReviewReaction: 'like' | 'dislike' | null = null;
  myReviewLikeCount = 0;
  myReviewDislikeCount = 0;

  communityReviews: CommunityReview[] = [];

  bookPostPreview: {
    userAvatar: string | null;
    userName: string;
    userInitial: string;
    content: string;
    likeCount: number;
    createdAt: string;
  } | null = null;
  bookPostPreviewLoaded = false;

  readonly statuses = SHELF_STATUSES;
  private userId: string | null = null;

  readonly timeAgo = timeAgo;
  private realtimeSubs: RealtimeSubscription[] = [];
  private realtimeTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  async ngOnInit(): Promise<void> {
    const googleId = this.route.snapshot.paramMap.get('googleId');
    if (!googleId) { this.error = this.copy.bookNotFound; this.isLoading = false; return; }

    try {
      const [bookRes, user] = await Promise.all([
        fetch(`/api/books/${googleId}`).then(async (r) => {
          if (!r.ok) {
            await r.json().catch(() => ({}));
            throw new Error(this.copy.loadFailed);
          }
          return r.json() as Promise<BookDetail>;
        }),
        this.supabaseService.getClient().then((s) => s.auth.getUser()),
      ]);

      this.book = bookRes;
      this.descriptionText = this.toPlainText(bookRes.description);
      this.userId = user.data.user?.id ?? null;

      if (this.userId) {
        const supabase = await this.supabaseService.getClient();
        const [ubResult, profileResult] = await Promise.all([
          firstValueFrom(this.bookService.getUserBookByGoogleId(this.userId, googleId)),
          supabase.from('users').select('name, profile_picture_url').eq('id', this.userId).single(),
        ]);
        this.userBook = ubResult;
        this.currentUserName = (profileResult.data?.['name'] as string) ?? null;
        this.currentUserAvatar = (profileResult.data?.['profile_picture_url'] as string) ?? null;
        this.note = this.userBook?.note ?? '';
        this.savedNote = this.note;
        this.savedReview = this.userBook?.reviewText ?? '';
        this.reviewText = this.savedReview;
        this.editingReview = !this.savedReview;
        this.myReviewUserBookId = this.userBook?.id ?? null;
      }

      if (this.book.dbBookId) {
        this.loadCommunityReviews(this.book.dbBookId);
        void this.loadBookPostPreview(this.book.dbBookId);
        void this.setupRealtime();
      }
    } catch {
      this.error = this.copy.loadFailed;
    } finally {
      this.isLoading = false;
    }
  }

  // Live-update the community reviews + rating distribution when anyone reviews
  // this book or reacts to a review. user_books is filtered to this book; review
  // reactions carry no book_id so that channel is unfiltered (debounced refetch
  // keeps the churn to one round-trip per burst).
  private async setupRealtime(): Promise<void> {
    if (!this.book?.dbBookId || !this.userId || this.realtimeSubs.length) return;
    const bookId = this.book.dbBookId;
    const subs = await Promise.all([
      this.supabaseService.createRealtimeSubscription('book-reviews', {
        tables: ['user_books'],
        filter: `book_id=eq.${bookId}`,
        onChange: () => this.scheduleReviewRefresh(),
        onReconnect: () => this.scheduleReviewRefresh(),
      }),
      this.supabaseService.createRealtimeSubscription('book-review-likes', {
        tables: ['review_likes'],
        onChange: () => this.scheduleReviewRefresh(),
        onReconnect: () => this.scheduleReviewRefresh(),
      }),
    ]);
    if (this.destroyed) { subs.forEach((s) => void s.teardown()); return; }
    this.realtimeSubs = subs;
  }

  private scheduleReviewRefresh(): void {
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    this.realtimeTimer = setTimeout(() => {
      this.realtimeTimer = null;
      void this.refreshReviewData();
    }, 700);
  }

  // Silently re-pull the community reviews (new/edited reviews + reaction
  // counts) and the server-computed rating distribution. Leaves the viewer's
  // own rating/review/note state untouched.
  private async refreshReviewData(): Promise<void> {
    if (!this.book?.dbBookId) return;
    this.loadCommunityReviews(this.book.dbBookId);
    try {
      const res = await fetch(`/api/books/${this.book.googleId}`);
      if (res.ok && this.book) {
        const fresh = (await res.json()) as BookDetail;
        this.book.ratingStats = fresh.ratingStats;
      }
    } catch { /* non-critical */ }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.realtimeTimer) clearTimeout(this.realtimeTimer);
    this.realtimeSubs.forEach((s) => void s.teardown());
  }

  get currentStatusLabel(): string {
    return SHELF_STATUSES.find((s) => s.name === this.userBook?.status?.name)?.label ?? '';
  }

  get displayRating(): number {
    return this.hoverRating || this.userBook?.rating || 0;
  }

  // Rating is only allowed once the book is marked "Already Read".
  get canRate(): boolean {
    return this.userBook?.status?.name === 'read';
  }

  // Short blurb for the Your Rating card, keyed off the current (hover or saved) rating.
  get ratingDescription(): string {
    const descs = [
      this.copy.ratingDesc1,
      this.copy.ratingDesc2,
      this.copy.ratingDesc3,
      this.copy.ratingDesc4,
      this.copy.ratingDesc5,
    ];
    return descs[this.displayRating - 1] ?? '';
  }

  starsArray(): Array<{ index: number; filled: boolean }> {
    return [1, 2, 3, 4, 5].map((n) => ({
      index: n,
      filled: n <= this.displayRating,
    }));
  }

  // Filled/empty stars for the community average (rounded to nearest whole star).
  communityStars(): Array<{ index: number; filled: boolean }> {
    const rounded = Math.round(this.book?.ratingStats?.average ?? 0);
    return [1, 2, 3, 4, 5].map((n) => ({ index: n, filled: n <= rounded }));
  }

  // Rating-card accessors with zero-state fallbacks so the community rating box
  // always renders, even when the book has no ratings yet.
  get ratingAverage(): number {
    return this.book?.ratingStats?.average ?? 0;
  }

  get ratingTotal(): number {
    return this.book?.ratingStats?.total ?? 0;
  }

  get ratingBuckets(): RatingBucket[] {
    return this.book?.ratingStats?.distribution ?? [5, 4, 3, 2, 1].map((star) => ({ star, count: 0, percent: 0 }));
  }

  async setRating(rating: number): Promise<void> {
    if (!this.userBook || this.savingRating || !this.canRate) return;
    this.savingRating = true;

    try {
      this.userBook = await firstValueFrom(
        this.bookService.setRating(this.userBook.id, rating),
      );
    } catch (err) {
      console.error(err);
    } finally {
      this.savingRating = false;
    }
  }

  toggleStatusDropdown(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  closeDropdown(): void {
    this.showStatusDropdown = false;
    this.showRecommendPicker = false;
  }

  async addToShelf(statusName: string): Promise<void> {
    if (!this.book || !this.userId || this.addingToShelf) return;
    this.showStatusDropdown = false;
    this.addingToShelf = true;

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: statusRow } = await supabase
        .from('reading_statuses')
        .select('status_id')
        .eq('status_name', statusName)
        .maybeSingle();

      if (!statusRow) return;

      const googleBook: GoogleBook = {
        googleId: this.book.googleId,
        title: this.book.title,
        author: this.book.author,
        description: this.book.description,
        publishedDate: this.book.publishedDate,
        coverUrl: this.book.coverUrl,
        pageCount: this.book.pageCount,
        categories: this.book.categories,
      };

      await this.bookService.addGoogleBookToShelf(googleBook, this.userId, statusRow['status_id']);
      this.userBook = await firstValueFrom(
        this.bookService.getUserBookByGoogleId(this.userId, this.book.googleId),
      );
    } catch (err) {
      console.error(err);
    } finally {
      this.addingToShelf = false;
    }
  }

  async changeStatus(statusName: string): Promise<void> {
    if (!this.userBook || this.savingStatus) return;
    this.showStatusDropdown = false;
    this.savingStatus = true;

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: statusRow } = await supabase
        .from('reading_statuses')
        .select('status_id')
        .eq('status_name', statusName)
        .maybeSingle();

      if (!statusRow) return;

      this.userBook = await firstValueFrom(
        this.bookService.changeShelfStatus(this.userBook.id, statusRow['status_id']),
      );
    } catch (err) {
      console.error(err);
    } finally {
      this.savingStatus = false;
    }
  }

  async removeFromShelf(): Promise<void> {
    if (!this.userBook) return;
    if (!(await this.confirmDialog.confirm({ message: this.copy.confirmRemove, danger: true }))) return;
    this.showStatusDropdown = false;

    try {
      await firstValueFrom(this.bookService.removeFromShelf(this.userBook.id));
      this.userBook = null;
    } catch (err) {
      console.error(err);
    }
  }

  async openRecommendPicker(): Promise<void> {
    this.showRecommendPicker = true;
    this.recommendFeedback = null;
    if (this.friends.length === 0) {
      this.friends = await this.friendshipService.getFriends().catch(() => []);
    }
  }

  closeRecommendPicker(): void {
    this.showRecommendPicker = false;
  }

  async recommendTo(friend: FriendUser): Promise<void> {
    if (!this.book || !this.userId || this.recommendingToId) return;
    this.recommendingToId = friend.userId;
    try {
      const { added } = await this.recommendationService.recommendBook(
        this.book.googleId,
        this.book.title,
        this.book.author,
        this.book.coverUrl,
        this.userId,
        friend.userId,
      );
      this.recommendFeedback = { userId: friend.userId, success: true, alreadyHad: !added };
    } catch {
      this.recommendFeedback = { userId: friend.userId, success: false };
    } finally {
      this.recommendingToId = null;
    }
  }

  startEditNote(): void {
    this.note = this.savedNote;
    this.editingNote = true;
  }

  cancelEditNote(): void {
    this.note = this.savedNote;
    this.editingNote = false;
  }

  async saveNote(): Promise<void> {
    if (!this.userBook || this.noteSaving) return;
    this.noteSaving = true;
    try {
      this.userBook = await firstValueFrom(
        this.bookService.saveNote(this.userBook.id, this.note),
      );
      this.savedNote = this.note;
      this.editingNote = false;
      this.noteSaved = true;
      setTimeout(() => { this.noteSaved = false; }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      this.noteSaving = false;
    }
  }

  startEditReview(): void {
    this.reviewText = this.savedReview;
    this.editingReview = true;
  }

  cancelEditReview(): void {
    this.reviewText = this.savedReview;
    this.editingReview = false;
  }

  async saveReview(): Promise<void> {
    if (!this.userBook || this.reviewSaving) return;
    this.reviewSaving = true;
    try {
      await firstValueFrom(
        this.bookService.saveReview(this.userBook.id, this.reviewText.trim()),
      );
      this.savedReview = this.reviewText.trim();
      if (this.userBook) this.userBook.reviewText = this.savedReview;
      this.editingReview = false;
      this.loadCommunityReviews(this.userBook!.bookId);
    } catch (err) {
      console.error(err);
    } finally {
      this.reviewSaving = false;
    }
  }

  async toggleReviewReaction(review: CommunityReview, wantLike: boolean): Promise<void> {
    if (!this.userId || review.reactionSaving) return;

    const prev = {
      likeCount: review.likeCount,
      dislikeCount: review.dislikeCount,
      myReaction: review.myReaction,
    };
    const target: 'like' | 'dislike' = wantLike ? 'like' : 'dislike';

    // Optimistically apply the toggle: drop the current reaction's count, then
    // either clear it (same button) or switch to the new one.
    if (review.myReaction === 'like') review.likeCount--;
    if (review.myReaction === 'dislike') review.dislikeCount--;
    if (review.myReaction === target) {
      review.myReaction = null;
    } else {
      if (wantLike) review.likeCount++; else review.dislikeCount++;
      review.myReaction = target;
    }

    review.reactionSaving = true;
    try {
      await firstValueFrom(
        this.likesService.toggleReviewReaction(review.userBookId, this.userId, review.userId, prev.myReaction, wantLike),
      );
    } catch {
      review.likeCount = prev.likeCount;
      review.dislikeCount = prev.dislikeCount;
      review.myReaction = prev.myReaction;
    } finally {
      review.reactionSaving = false;
    }
  }

  async toggleMyReviewReaction(wantLike: boolean): Promise<void> {
    if (!this.userId || this.myReviewUserBookId === null) return;
    const prev = { reaction: this.myReviewReaction, likes: this.myReviewLikeCount, dislikes: this.myReviewDislikeCount };
    const target: 'like' | 'dislike' = wantLike ? 'like' : 'dislike';
    if (this.myReviewReaction === 'like') this.myReviewLikeCount--;
    if (this.myReviewReaction === 'dislike') this.myReviewDislikeCount--;
    if (this.myReviewReaction === target) {
      this.myReviewReaction = null;
    } else {
      if (wantLike) this.myReviewLikeCount++; else this.myReviewDislikeCount++;
      this.myReviewReaction = target;
    }
    try {
      await firstValueFrom(
        this.likesService.toggleReviewReaction(this.myReviewUserBookId, this.userId, this.userId, prev.reaction, wantLike),
      );
    } catch {
      this.myReviewReaction = prev.reaction;
      this.myReviewLikeCount = prev.likes;
      this.myReviewDislikeCount = prev.dislikes;
    }
  }

  private async loadCommunityReviews(bookId: number): Promise<void> {
    if (!this.userId) return;
    try {
      const supabase = await this.supabaseService.getClient();
      const [all, blockedStatusRes] = await Promise.all([
        this.bookService.getCommunityReviews(bookId, this.userId),
        supabase.from('friendship_status').select('status_id').eq('status_name', 'blocked').single(),
      ]);

      const blockedStatusId = blockedStatusRes.data?.['status_id'];
      // Build set of users involved in any block relationship with current user
      const blockedIds = new Set<string>();
      if (blockedStatusId) {
        const { data: blockedRows } = await supabase
          .from('friendship')
          .select('user_id1, user_id2')
          .or(`user_id1.eq.${this.userId},user_id2.eq.${this.userId}`)
          .eq('status_id', blockedStatusId);
        for (const row of blockedRows ?? []) {
          const other = row['user_id1'] === this.userId ? row['user_id2'] : row['user_id1'];
          blockedIds.add(other as string);
        }
      }

      const ownIdx = all.findIndex(r => r.userId === this.userId);
      if (ownIdx !== -1) {
        const own = all[ownIdx];
        this.myReviewUserBookId = own.userBookId;
        this.myReviewReaction = own.myReaction;
        this.myReviewLikeCount = own.likeCount;
        this.myReviewDislikeCount = own.dislikeCount;
        this.communityReviews = all.filter((r, i) => i !== ownIdx && !blockedIds.has(r.userId));
      } else {
        this.communityReviews = all.filter(r => !blockedIds.has(r.userId));
      }
    } catch {
      // non-critical
    }
  }

  private async loadBookPostPreview(bookId: number): Promise<void> {
    try {
      const session = await this.supabaseService.getCurrentSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/community/posts?bookId=${bookId}&page=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const posts = (await res.json()) as Array<{
        userAvatar?: string | null;
        userName?: string;
        content?: string;
        likeCount?: number;
        createdAt?: string;
      }>;
      const first = posts[0] ?? null;
      this.bookPostPreview = first
        ? {
            userAvatar: first.userAvatar ?? null,
            userName: first.userName ?? 'Reader',
            userInitial: (first.userName ?? 'R')[0].toUpperCase(),
            content: first.content ?? '',
            likeCount: first.likeCount ?? 0,
            createdAt: first.createdAt ?? '',
          }
        : null;
    } catch {
      // non-critical
    } finally {
      this.bookPostPreviewLoaded = true;
    }
  }

  starsRange(): number[] {
    return [1, 2, 3, 4, 5];
  }

  sentimentEmoji(s: string | null): string {
    return ({ positive: '😊', negative: '😞', neutral: '😐', mixed: '🤔' } as Record<string, string>)[s ?? ''] ?? '';
  }

  sentimentLabel(s: string | null): string {
    const c = COMMUNITY_COPY[this.lang];
    switch (s) {
      case 'positive': return c.sentimentPositive;
      case 'negative': return c.sentimentNegative;
      case 'neutral': return c.sentimentNeutral;
      case 'mixed': return c.sentimentMixed;
      default: return '';
    }
  }

  get publishYear(): string {
    return this.book?.publishedDate?.slice(0, 4) ?? '';
  }

  // Google Books descriptions arrive as HTML (e.g. <p>, <br>, <b>, &quot;).
  // Interpolating that with {{ }} shows the raw tags as text, so convert it to
  // readable plain text: line breaks for block tags, strip the rest, decode
  // entities. Runs once (in ngOnInit) — not a per-CD getter.
  private toPlainText(html: string | null): string {
    if (!html) return '';
    const withBreaks = html
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/\s*p\s*>/gi, '\n\n')
      .replace(/<[^>]+>/g, '');
    const ta = document.createElement('textarea');
    ta.innerHTML = withBreaks;
    return ta.value.replace(/\n{3,}/g, '\n\n').trim();
  }
}
