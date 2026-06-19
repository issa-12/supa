import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService, HOME_COPY, LanguageCode, translateGenre } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Book {
  id: string;
  googleBooksId?: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  rating?: number;
  genre?: string | null;
}

@Component({
  selector: 'app-recommended-books',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="recommended-section">
      <div class="section-header">
        <div class="section-title-wrap">
          <h2 class="section-title">{{ copy.recommendedTitle }}</h2>
          <span class="section-sub">{{ copy.recommendedSubtitle }}</span>
        </div>
      </div>

      <div class="rec-grid">
        <div *ngFor="let book of books" class="rec-card"
          (click)="onCardClick(book)"
          [style.cursor]="book.googleBooksId ? 'pointer' : 'default'">
          <div class="rec-cover-wrap">
            <img *ngIf="book.coverUrl" class="rec-cover" [src]="book.coverUrl" [alt]="book.title + ' Cover'" loading="lazy" (error)="book.coverUrl = null" />
            <div *ngIf="!book.coverUrl" class="rec-cover rec-cover--empty">
              <iconify-icon icon="lucide:book" style="font-size: 20px"></iconify-icon>
            </div>
          </div>
          <div class="rec-info">
            <div class="rec-title">{{ book.title }}</div>
            <div class="rec-author">{{ book.author }}</div>
            <span *ngIf="book.genre" class="rec-genre">{{ genreLabel(book.genre) }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: contents;
      --ui-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .recommended-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-family: var(--ui-sans);
    }

    .section-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
    }

    .section-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .section-title {
      font-size: 20px;
      line-height: 1.2;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.2px;
      margin: 0;
    }

    .section-sub {
      font-size: 10px;
      font-weight: 400;
      letter-spacing: 0.09em;
      color: #9E8E82;
      text-transform: uppercase;
      margin-top: 3px;
    }

    .rec-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      align-items: stretch;
    }

    .rec-card {
      min-height: 88px;
      background: var(--surface);
      border-radius: 12px;
      border: 1px solid var(--border);
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      cursor: pointer;
      transition: box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease;

      &:hover {
        border-color: var(--border-strong);
        box-shadow: 0 4px 20px rgba(60, 30, 10, 0.10);
        transform: translateY(-2px);
      }
    }

    .rec-cover-wrap {
      width: 46px;
      height: 66px;
      flex-shrink: 0;
    }

    .rec-cover {
      width: 46px;
      height: 66px;
      border-radius: 6px;
      object-fit: cover;
      display: block;

      &--empty {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--surface-alt);
        color: var(--muted-foreground);
      }
    }

    .rec-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .rec-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      line-height: 1.3;
      overflow-wrap: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .rec-author {
      font-size: 12px;
      color: var(--muted-foreground);
      margin-top: 3px;
      overflow-wrap: break-word;
    }

    .rec-genre {
      align-self: flex-start;
      margin-top: 8px;
      font-size: 10px;
      font-weight: 500;
      padding: 3px 9px;
      border-radius: 999px;
      background: #FAF0ED;
      color: #8B3E2A;
    }

    // Two columns on narrow screens, single column on the smallest.
    @media (max-width: 900px) {
      .rec-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 420px) {
      .rec-grid { grid-template-columns: minmax(0, 1fr); }
    }
  `],
})
export class RecommendedBooksComponent {
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  @Input() books: Book[] = [];
  @Output() addBook = new EventEmitter<Book>();

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return HOME_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  // Display-only: translate the genre name for the card pill.
  protected genreLabel(g: string | null | undefined): string {
    return g ? translateGenre(g, this.lang) : '';
  }

  // The "+" button adds to the shelf without navigating into the card.
  onAdd(book: Book, event: MouseEvent): void {
    event.stopPropagation();
    this.addBook.emit(book);
  }

  onCardClick(book: Book): void {
    if (book.googleBooksId) {
      this.router.navigate(['/books', book.googleBooksId]);
    }
  }
}
