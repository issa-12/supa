import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { BookService, GoogleBook } from '../../core/services/book.service';
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
  imports: [RouterLink, FormsModule, SlicePipe, TopNavComponent],
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

  query = '';
  results: GoogleBook[] = [];
  isSearching = false;
  isLoadingMore = false;
  hasSearched = false;
  searchError: string | null = null;
  totalItems = 0;

  openDropdownId: string | null = null;
  addingBookId: string | null = null;
  addedBooks = new Map<string, string>(); // googleId → status label
  addError: string | null = null;

  private startIndex = 0;
  private readonly pageSize = 20;
  private searchTimer?: ReturnType<typeof setTimeout>;

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
    return this.results.length < this.totalItems;
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

    if (!this.query.trim() || this.query.trim().length < 2) {
      this.results = [];
      this.hasSearched = false;
      this.totalItems = 0;
      return;
    }

    this.searchTimer = setTimeout(() => void this.runSearch(), 500);
  }

  async onSubmit(): Promise<void> {
    clearTimeout(this.searchTimer);
    await this.runSearch();
  }

  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.hasMore) return;
    this.isLoadingMore = true;
    try {
      const { books } = await this.bookService.searchBooks(this.query.trim(), this.startIndex);
      this.results = [...this.results, ...books];
      this.startIndex += books.length;
    } catch {
      // silently ignore — existing results remain
    } finally {
      this.isLoadingMore = false;
    }
  }

  private async runSearch(): Promise<void> {
    const q = this.query.trim();
    if (q.length < 2) return;

    this.isSearching = true;
    this.searchError = null;
    this.hasSearched = true;
    this.openDropdownId = null;
    this.startIndex = 0;
    this.totalItems = 0;

    try {
      const { books, totalItems } = await this.bookService.searchBooks(q, 0);
      this.results = books;
      this.totalItems = totalItems;
      this.startIndex = books.length;
    } catch (err) {
      this.searchError = err instanceof Error ? err.message : 'Search failed. Please try again.';
      this.results = [];
    } finally {
      this.isSearching = false;
    }
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

      if (!user) throw new Error('Not signed in.');

      await this.bookService.addGoogleBookToShelf(book, user.id, status.id);
      this.addedBooks.set(book.googleId, status.label);
    } catch (err) {
      this.addError = err instanceof Error ? err.message : 'Could not add book. Try again.';
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
  }
}
