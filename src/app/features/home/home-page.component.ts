import { Component, inject, OnInit, OnDestroy, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BookService } from '../../core/services/book.service';
import { UserService, UserProfile } from '../../core/services/user.service';
import { TopNavComponent } from './components/top-nav.component';
import { HeroSectionComponent } from './components/hero-section.component';
import { RecommendedBooksComponent } from './components/recommended-books.component';
import { TrendingBooksComponent } from './components/trending-books.component';
import { PostsFeedComponent } from './components/posts-feed.component';
import { TranslationService, HOME_COPY, LanguageCode } from '../../i18n';

interface Book {
  id: string;
  googleBooksId?: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  description?: string | null;
  rating?: number;
  genre?: string | null;
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
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  private readonly destroy$ = new Subject<void>();

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return HOME_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

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
  favoriteGenre: string | null = null;
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
        next: (basicUser) => {
          // getCurrentUserProfile only reads auth.users — fetch the full
          // public.users row so avatar + bio + username are available
          // for the top-nav and post composer.
          this.userService
            .getUserProfileById(basicUser.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (full) => {
                this.currentUser = full;
                this.currentUserAvatar = full.avatarUrl;
              },
              error: () => {
                this.currentUser = basicUser;
                this.currentUserAvatar = basicUser.avatarUrl;
              },
            });

          this.currentUserId = basicUser.id;
          this.isLoading = false;

          this.userService
            .getUserGenres(basicUser.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (genres) => { this.favoriteGenre = genres[0]?.name ?? null; },
              error: () => { /* non-critical — hero falls back to a generic label */ },
            });

          this.loadContinueReadingBooks();
          this.loadRecommendedBooks();
          this.loadTrendingBooks();
        },
        error: (err) => {
          console.error('Failed to load user profile:', err);
          this.error = this.copy.loadProfileError;
          this.isLoading = false;
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
      .getRecommendedBooks(this.currentUserId || '', 7)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (books) => {
          const mapped = books.map((b) => this.mapBook(b));
          if (mapped.length > 0) {
            this.heroBook = mapped[0];
            this.recommendedBooks = mapped.slice(1);
          } else {
            this.recommendedBooks = [];
          }
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
      genre: book.genre ?? null,
    };
  }

  openCompose(): void {
    this.postsFeed?.openCompose();
  }

  onAddToReading(book: Book): void {
    if (!this.currentUserId) return;
    const bookId = parseInt(book.id, 10);
    if (isNaN(bookId) || bookId <= 0) return;
    this.bookService
      .addBookToReadingList(this.currentUserId, bookId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: (err) => console.error('Failed to add book:', err) });
  }

  // The hero card adds the book to "currently reading" itself; just refresh
  // the Continue Reading row so the newly added book shows up immediately.
  onHeroAdded(): void {
    this.loadContinueReadingBooks();
  }

  onContinueReading(book: ContinueReadingBook): void {
    if (book.googleBooksId) {
      void this.router.navigate(['/books', book.googleBooksId]);
    }
  }

  onAddBook(book: Book): void {
    this.onAddToReading(book);
  }
}
