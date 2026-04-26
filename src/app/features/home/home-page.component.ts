import { Component, inject, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService } from '../../core/services/book.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { ActivityService } from '../../core/services/activity.service';
import { TopNavComponent } from './components/top-nav.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { ContinueReadingComponent } from './components/continue-reading.component';
import { RecommendedBooksComponent } from './components/recommended-books.component';
import { TrendingBooksComponent } from './components/trending-books.component';
import { FriendsActivityComponent } from './components/friends-activity.component';

// Local interfaces matching component expectations
interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  rating?: number;
}

interface ContinueReadingBook extends Book {
  progress: number;
  currentPage: number;
  totalPages: number;
}

interface ActivityPost {
  id: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TopNavComponent,
    HeroSectionComponent,
    ContinueReadingComponent,
    RecommendedBooksComponent,
    TrendingBooksComponent,
    FriendsActivityComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly supabaseService = inject(SupabaseService);
  private readonly bookService = inject(BookService);
  private readonly userService = inject(UserService);
  private readonly activityService = inject(ActivityService);
  private readonly destroy$ = new Subject<void>();

  // Loading states
  isLoading = true;
  isLoadingContinue = true;
  isLoadingRecommended = true;
  isLoadingTrending = true;
  isLoadingActivity = true;
  error: string | null = null;

  // Current user
  currentUser: UserProfile | null = null;
  currentUserId: string | null = null;

  // Data
  heroBook: Book | null = null;
  continueReadingBooks: ContinueReadingBook[] = [];
  recommendedBooks: Book[] = [];
  trendingBooks: Book[] = [];
  friendActivity: ActivityPost[] = [];

  ngOnInit(): void {
    this.loadHomePageData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHomePageData(): void {
    // First, get current user
    this.userService
      .getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.currentUserId = user.id;
          this.isLoading = false;

          // Load all the home page data
          this.loadFeaturedBook();
          this.loadContinueReadingBooks();
          this.loadRecommendedBooks();
          this.loadTrendingBooks();
          this.loadFriendActivity();
        },
        error: (err) => {
          console.error('Failed to load user profile:', err);
          this.error = 'Failed to load user profile';
          this.isLoading = false;
        },
      });
  }

  private loadFeaturedBook(): void {
    this.bookService
      .getFeaturedBook()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (book) => {
          this.heroBook = this.mapServiceBookToUI(book);
        },
        error: (err) => {
          console.error('Failed to load featured book:', err);
        },
      });
  }

  private loadContinueReadingBooks(): void {
    if (!this.currentUserId) return;

    this.isLoadingContinue = true;
    this.bookService
      .getContinueReadingBooks(this.currentUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userBooks) => {
          this.continueReadingBooks = userBooks.map((ub) => ({
            ...this.mapServiceBookToUI(ub.book || { id: ub.bookId, title: '', author: '', description: null, publishDate: null, coverUrl: null }),
            progress: Math.random() * 100,
            currentPage: 0,
            totalPages: 0,
          }));
          this.isLoadingContinue = false;
        },
        error: (err) => {
          console.error('Failed to load continue reading books:', err);
          this.isLoadingContinue = false;
        },
      });
  }

  private loadRecommendedBooks(): void {
    this.isLoadingRecommended = true;
    this.bookService
      .getRecommendedBooks(this.currentUserId || '', 6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (books) => {
          this.recommendedBooks = books.map((b) => this.mapServiceBookToUI(b));
          this.isLoadingRecommended = false;
        },
        error: (err) => {
          console.error('Failed to load recommended books:', err);
          this.isLoadingRecommended = false;
        },
      });
  }

  private loadTrendingBooks(): void {
    this.isLoadingTrending = true;
    this.bookService
      .getTrendingBooks(6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (books) => {
          this.trendingBooks = books.map((b) => this.mapServiceBookToUI(b));
          this.isLoadingTrending = false;
        },
        error: (err) => {
          console.error('Failed to load trending books:', err);
          this.isLoadingTrending = false;
        },
      });
  }

  private loadFriendActivity(): void {
    if (!this.currentUserId) return;

    this.isLoadingActivity = true;
    this.activityService
      .getFriendActivity(this.currentUserId, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (posts) => {
          this.friendActivity = posts.map((p) => ({
            id: p.id.toString(),
            bookId: p.bookId.toString(),
            bookTitle: p.bookTitle,
            bookCover: p.bookCover,
            content: p.content,
            userId: p.userId,
            userName: p.userName,
            userAvatar: p.userAvatar,
            createdAt: p.createdAt,
            likeCount: p.likeCount,
            commentCount: p.commentCount,
          }));
          this.isLoadingActivity = false;
        },
        error: (err) => {
          console.error('Failed to load friend activity:', err);
          this.isLoadingActivity = false;
        },
      });
  }

  // Helper method to map service Book interface to UI Book interface
  private mapServiceBookToUI(book: any): Book {
    return {
      id: book.id.toString(),
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      rating: book.rating,
    };
  }

  // Event handlers for child components
  onAddToReading(book: Book): void {
    if (!this.currentUserId) {
      console.error('User not authenticated');
      return;
    }

    const bookId = parseInt(book.id, 10);
    if (isNaN(bookId)) {
      console.error('Invalid book ID');
      return;
    }

    this.bookService
      .addBookToReadingList(this.currentUserId, bookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (userBook) => {
          console.log('Book added to reading list:', userBook);
          // TODO: Show success toast
        },
        error: (err) => {
          console.error('Failed to add book:', err);
          // TODO: Show error toast
        },
      });
  }

  onContinueReading(book: ContinueReadingBook): void {
    // TODO: Navigate to book reader with saved position
    console.log('Continue reading:', book);
  }

  onAddBook(book: Book): void {
    // Same as onAddToReading
    this.onAddToReading(book);
  }
}
