import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, GoogleBook, BookSearchOptions } from '../../core/services/book.service';
import { TranslationService, BOOK_SEARCH_COPY, LanguageCode } from '../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TopNavComponent } from '../home/components/top-nav.component';

interface ShelfStatus {
  id: number;
  name: string;
  label: string;
  icon: string;
}

const SHELF_STATUS_DEFS: Array<{ name: string; label: string; icon: string }> = [
  { name: 'want_to_read', label: '', icon: '📚' },
  { name: 'currently_reading', label: '', icon: '📖' },
  { name: 'read', label: '', icon: '✓' },
];

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [FormsModule, TopNavComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './book-search.component.html',
  styleUrl: './book-search.component.scss',
})
export class BookSearchComponent implements OnInit, OnDestroy {
  private readonly bookService = inject(BookService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translationService = inject(TranslationService);

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return BOOK_SEARCH_COPY[this.lang]; }

  statuses: ShelfStatus[] = [];

  readonly suggestions = ['Atomic Habits', 'Dune', 'The Alchemist', '1984', 'Colleen Hoover'];

  query = '';
  results: GoogleBook[] = [];
  isSearching = false;
  isLoadingMore = false;
  hasSearched = false;
  searchError: string | null = null;
  totalItems = 0;
  authorFilter = '';
  isbnFilter = '';
  languageFilter = '';
  sortBy = 'relevance';

  openDropdownId: string | null = null;
  addingBookId: string | null = null;
  addedBooks = new Map<string, string>(); // googleId → status label
  addError: string | null = null;

  private startIndex = 0;
  private moreAvailable = false;
  private searchTimer?: ReturnType<typeof setTimeout>;
  private filterTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => {
      this.lang = l;
      SHELF_STATUS_DEFS[0].label = this.copy.wantToReadStatusLabel;
      SHELF_STATUS_DEFS[1].label = this.copy.currentlyReadingStatusLabel;
      SHELF_STATUS_DEFS[2].label = this.copy.alreadyReadStatusLabel;
      if (this.statuses.length > 0) {
        this.statuses[0].label = this.copy.wantToReadStatusLabel;
        if (this.statuses.length > 1) this.statuses[1].label = this.copy.currentlyReadingStatusLabel;
        if (this.statuses.length > 2) this.statuses[2].label = this.copy.alreadyReadStatusLabel;
      }
    });
  }

  get hasMore(): boolean {
    return this.moreAvailable;
  }

  get displayedResults(): GoogleBook[] {
    if (this.sortBy === 'title') {
      return [...this.results].sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' }),
      );
    }
    return this.results;
  }

  runSuggestion(term: string): void {
    this.query = term;
    clearTimeout(this.searchTimer);
    void this.runSearch();
  }

  async ngOnInit(): Promise<void> {
    await this.loadStatuses();
    const q = this.route.snapshot.queryParamMap.get('q')?.trim() ?? '';
    if (q.length >= 2) {
      this.query = q;
      void this.runSearch();
    }
  }

  private async loadStatuses(): Promise<void> {
    const supabase = await this.supabaseService.getClient();
    const { data } = await supabase
      .from('reading_statuses')
      .select('status_id, status_name');
    const byName = new Map<string, number>(
      (data ?? []).map((r) => [r['status_name'] as string, r['status_id'] as number]),
    );
    this.statuses = SHELF_STATUS_DEFS.flatMap((def) => {
      const id = byName.get(def.name);
      const label = def.name === 'want_to_read' ? this.copy.wantToReadStatusLabel
                  : def.name === 'currently_reading' ? this.copy.currentlyReadingStatusLabel
                  : this.copy.alreadyReadStatusLabel;
      return id ? [{ id, name: def.name, label, icon: def.icon }] : [];
    });
  }

  onQueryChange(): void {
    clearTimeout(this.searchTimer);
    this.searchError = null;

    if (!this.canSearch) {
      this.results = [];
      this.hasSearched = false;
      this.totalItems = 0;
      this.moreAvailable = false;
      return;
    }

    this.searchTimer = setTimeout(() => void this.runSearch(), 350);
  }

  async onSubmit(): Promise<void> {
    clearTimeout(this.searchTimer);
    await this.runSearch();
  }

  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    try {
      const response = await this.bookService.searchBooks(
        this.query.trim(),
        this.startIndex,
        this.searchOptions,
      );
      const existingIds = new Set(this.results.map((book) => book.googleId));
      this.results = [
        ...this.results,
        ...response.books.filter((book) => !existingIds.has(book.googleId)),
      ];
      this.startIndex = response.nextStartIndex;
      this.moreAvailable = response.books.length > 0 && response.hasMore;
    } catch {
      // silently ignore — existing results remain
    } finally {
      this.isLoadingMore = false;
    }
  }

  private async runSearch(): Promise<void> {
    const q = this.query.trim();
    if (!this.canSearch) return;

    this.isSearching = true;
    this.searchError = null;
    this.hasSearched = true;
    this.openDropdownId = null;
    this.startIndex = 0;
    this.totalItems = 0;
    this.moreAvailable = false;

    try {
      const response = await this.bookService.searchBooks(q, 0, this.searchOptions);
      this.results = response.books;
      this.totalItems = response.totalItems;
      this.startIndex = response.nextStartIndex;
      this.moreAvailable = response.hasMore;
    } catch (err) {
      this.searchError = this.copy.searchFailed;
      this.results = [];
    } finally {
      this.isSearching = false;
    }
  }

  get activeFilterCount(): number {
    return [
      this.authorFilter.trim(),
      this.isbnFilter.trim(),
      this.languageFilter,
    ].filter(Boolean).length;
  }

  get canSearch(): boolean {
    return this.query.trim().length >= 2;
  }

  onFiltersChange(): void {
    clearTimeout(this.filterTimer);
    if (!this.canSearch) return;
    this.filterTimer = setTimeout(() => void this.runSearch(), 350);
  }

  resetFilters(): void {
    this.authorFilter = '';
    this.isbnFilter = '';
    this.languageFilter = '';
    if (this.query.trim().length >= 2) void this.runSearch();
  }

  private get searchOptions(): BookSearchOptions {
    return {
      author: this.authorFilter,
      isbn: this.isbnFilter,
      language: this.languageFilter,
      sort: this.sortBy,
    };
  }

  toggleDropdown(googleId: string): void {
    this.openDropdownId = this.openDropdownId === googleId ? null : googleId;
    this.addError = null;
  }

  async addToShelf(book: GoogleBook, status: ShelfStatus): Promise<void> {
    this.openDropdownId = null;
    this.addingBookId = book.googleId;
    this.addError = null;

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error(this.copy.notSignedIn);

      await this.bookService.addGoogleBookToShelf(book, user.id, status.id);
      this.addedBooks.set(book.googleId, status.label);
    } catch (err) {
      this.addError = this.copy.addFailed;
    } finally {
      this.addingBookId = null;
    }
  }

  getAddedLabel(googleId: string): string | null {
    return this.addedBooks.get(googleId) ?? null;
  }

  goToDetail(book: GoogleBook): void {
    this.router.navigate(['/books', book.googleId]);
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
    clearTimeout(this.filterTimer);
  }
}
