import { Component, inject, OnInit, OnDestroy, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BookService } from '../../core/services/book.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { TopNavComponent } from './components/top-nav.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { ContinueReadingComponent } from './components/continue-reading.component';
import { RecommendedBooksComponent } from './components/recommended-books.component';
import { TrendingBooksComponent } from './components/trending-books.component';
import { PostsFeedComponent } from './components/posts-feed.component';

interface Book {
  id: string;
  googleBooksId?: string | null;
  title: string;
  author: string;
  coverUrl: string;
  description?: string | null;
  rating?: number;
}

interface ContinueReadingBook extends Book {
  progress: number;
  currentPage: number;
  totalPages: number;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    TopNavComponent,
    HeroSectionComponent,
    ContinueReadingComponent,
    RecommendedBooksComponent,
    TrendingBooksComponent,
    PostsFeedComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly bookService = inject(BookService);
  private readonly userService = inject(UserService);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(PostsFeedComponent) private postsFeed?: PostsFeedComponent;

  isLoading = true;
  isLoadingContinue = true;
  isLoadingRecommended = true;
  isLoadingTrending = true;
  error: string | null = null;

  currentUser: UserProfile | null = null;
  currentUserId: string | null = null;
  currentUserAvatar: string | null = null;

  heroBook: Book | null = null;
  continueReadingBooks: ContinueReadingBook[] = [];
  recommendedBooks: Book[] = [];
  trendingBooks: Book[] = [];

  ngOnInit(): void {
    this.loadHomePageData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadHomePageData(): void {
    this.userService
      .getCurrentUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.currentUserId = user.id;
          this.currentUserAvatar = user.avatarUrl;
          this.isLoading = false;

          this.loadFeaturedBook();
          this.loadContinueReadingBooks();
          this.loadRecommendedBooks();
          this.loadTrendingBooks();
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
          this.heroBook = book ? this.mapBook(book) : null;
        },
        error: () => {},
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
          this.continueReadingBooks = userBooks.map((ub) => {
            const cp = ub.currentPage ?? 0;
            const tp = ub.totalPages ?? 0;
            return {
              ...this.mapBook(ub.book || { id: ub.bookId, title: '', author: '', description: null, publishDate: null, coverUrl: null }),
              progress: cp > 0 && tp > 0 ? Math.min(100, Math.round((cp / tp) * 100)) : 0,
              currentPage: cp,
              totalPages: tp,
            };
          });
          this.isLoadingContinue = false;
        },
        error: () => { this.isLoadingContinue = false; },
      });
  }

  private loadRecommendedBooks(): void {
    this.isLoadingRecommended = true;
    this.bookService
      .getRecommendedBooks(this.currentUserId || '', 6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (books) => {
          this.recommendedBooks = books.map((b) => this.mapBook(b));
          this.isLoadingRecommended = false;
        },
        error: () => { this.isLoadingRecommended = false; },
      });
  }

  private loadTrendingBooks(): void {
    this.isLoadingTrending = true;
    this.bookService
      .getTrendingBooks(6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (books) => {
          this.trendingBooks = books.map((b) => this.mapBook(b));
          this.isLoadingTrending = false;
        },
        error: () => { this.isLoadingTrending = false; },
      });
  }

  private mapBook(book: any): Book {
    return {
      id: book.id.toString(),
      googleBooksId: book.googleBooksId ?? null,
      title: book.title,
      author: book.author,
      coverUrl: book.coverUrl,
      description: book.description ?? null,
      rating: book.rating,
    };
  }

  openCompose(): void {
    this.postsFeed?.openCompose();
  }

  onAddToReading(book: Book): void {
    if (!this.currentUserId) return;
    const bookId = parseInt(book.id, 10);
    if (isNaN(bookId)) return;
    this.bookService
      .addBookToReadingList(this.currentUserId, bookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: (err) => console.error('Failed to add book:', err) });
  }

  onContinueReading(book: ContinueReadingBook): void {
    console.log('Continue reading:', book);
  }

  onAddBook(book: Book): void {
    this.onAddToReading(book);
  }
}
