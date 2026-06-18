import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, UserBook, GoogleBook, CommunityReview } from '../../core/services/book.service';
import { FriendshipService, FriendUser } from '../../core/services/friendship.service';
import { RecommendationService } from '../../core/services/recommendation.service';
import { LikesService } from '../../core/services/likes.service';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { TranslationService, BOOK_DETAIL_COPY, LanguageCode, GenreNamePipe } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  imports: [RouterLink, FormsModule, GenreNamePipe],
  templateUrl: './book-detail.component.html',
  styleUrl: './book-detail.component.scss',
})
export class BookDetailComponent implements OnInit {
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
  noteSaving = false;
  noteSaved = false;

  reviewText = '';        // editing buffer (bound to the textarea)
  savedReview = '';       // the persisted review — shown as a posted card
  editingReview = false;
  reviewSaving = false;

  communityReviews: CommunityReview[] = [];

  readonly statuses = SHELF_STATUSES;
  private userId: string | null = null;

  async ngOnInit(): Promise<void> {
    const googleId = this.route.snapshot.paramMap.get('googleId');
    if (!googleId) { this.error = this.copy.bookNotFound; this.isLoading = false; return; }

    try {
      const [bookRes, user] = await Promise.all([
        fetch(`/api/books/${googleId}`).then(async (r) => {
          if (!r.ok) {
            const body = (await r.json().catch(() => ({}))) as { message?: string };
            throw new Error(body.message ?? 'Failed to load book.');
          }
          return r.json() as Promise<BookDetail>;
        }),
        this.supabaseService.getClient().then((s) => s.auth.getUser()),
      ]);

      this.book = bookRes;
      this.descriptionText = this.toPlainText(bookRes.description);
      this.userId = user.data.user?.id ?? null;

      if (this.userId) {
        this.userBook = await firstValueFrom(
          this.bookService.getUserBookByGoogleId(this.userId, googleId),
        );
        this.note = this.userBook?.note ?? '';
        this.savedReview = this.userBook?.reviewText ?? '';
        this.reviewText = this.savedReview;
      }

      if (this.book.dbBookId) {
        this.loadCommunityReviews(this.book.dbBookId);
      }
    } catch {
      this.error = this.copy.loadFailed;
    } finally {
      this.isLoading = false;
    }
  }

  get currentStatusLabel(): string {
    return SHELF_STATUSES.find((s) => s.name === this.userBook?.status?.name)?.label ?? '';
  }

  get displayRating(): number {
    return this.hoverRating || this.userBook?.rating || 0;
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

  async setRating(rating: number): Promise<void> {
    if (!this.userBook || this.savingRating) return;
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

  async saveNote(): Promise<void> {
    if (!this.userBook || this.noteSaving) return;
    this.noteSaving = true;
    try {
      this.userBook = await firstValueFrom(
        this.bookService.saveNote(this.userBook.id, this.note),
      );
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
      this.userBook = await firstValueFrom(
        this.bookService.saveReview(this.userBook.id, this.reviewText.trim()),
      );
      // Switch to the "posted" card view.
      this.savedReview = this.userBook?.reviewText ?? this.reviewText.trim();
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

  private async loadCommunityReviews(bookId: number): Promise<void> {
    if (!this.userId) return;
    try {
      this.communityReviews = await this.bookService.getCommunityReviews(bookId, this.userId);
    } catch {
      // non-critical
    }
  }

  starsRange(): number[] {
    return [1, 2, 3, 4, 5];
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
