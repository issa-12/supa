import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, UserBook, GoogleBook, CommunityReview } from '../../core/services/book.service';
import { FriendshipService, FriendUser } from '../../core/services/friendship.service';
import { RecommendationService } from '../../core/services/recommendation.service';

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
}

const SHELF_STATUSES = [
  { name: 'currently_reading', label: 'Currently Reading', icon: '📖' },
  { name: 'want_to_read', label: 'Want to Read', icon: '📚' },
  { name: 'read', label: 'Already Read', icon: '✓' },
];

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
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

  book: BookDetail | null = null;
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
  recommendFeedback: { userId: string; success: boolean } | null = null;

  note = '';
  noteSaving = false;
  noteSaved = false;

  reviewText = '';
  reviewSaving = false;
  reviewSaved = false;

  communityReviews: CommunityReview[] = [];

  readonly statuses = SHELF_STATUSES;
  private userId: string | null = null;

  async ngOnInit(): Promise<void> {
    const googleId = this.route.snapshot.paramMap.get('googleId');
    if (!googleId) { this.error = 'Book not found.'; this.isLoading = false; return; }

    try {
      const [bookRes, user] = await Promise.all([
        fetch(`/api/books/${googleId}`).then((r) => r.json() as Promise<BookDetail>),
        this.supabaseService.getClient().then((s) => s.auth.getUser()),
      ]);

      this.book = bookRes;
      this.userId = user.data.user?.id ?? null;

      if (this.userId) {
        this.userBook = await firstValueFrom(
          this.bookService.getUserBookByGoogleId(this.userId, googleId),
        );
        this.note = this.userBook?.note ?? '';
        this.reviewText = this.userBook?.reviewText ?? '';
      }

      if (this.book.dbBookId) {
        this.loadCommunityReviews(this.book.dbBookId);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load book.';
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
    if (!confirm('Remove this book from your shelf?')) return;
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
      await this.recommendationService.recommendBook(
        this.book.googleId,
        this.book.title,
        this.book.author,
        this.book.coverUrl,
        this.userId,
        friend.userId,
      );
      this.recommendFeedback = { userId: friend.userId, success: true };
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

  async saveReview(): Promise<void> {
    if (!this.userBook || this.reviewSaving) return;
    this.reviewSaving = true;
    try {
      this.userBook = await firstValueFrom(
        this.bookService.saveReview(this.userBook.id, this.reviewText),
      );
      this.reviewSaved = true;
      setTimeout(() => { this.reviewSaved = false; }, 2000);
      this.loadCommunityReviews(this.userBook.bookId);
    } catch (err) {
      console.error(err);
    } finally {
      this.reviewSaving = false;
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
}
