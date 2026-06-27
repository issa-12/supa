import { Component, Input, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService, HOME_COPY, LanguageCode } from '../../../i18n';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface Book {
  id: string;
  googleBooksId?: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
}

@Component({
  selector: 'app-trending-books',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="trending-section">
      <div class="section-header">
        <h2 class="section-title">{{ copy.trendingTitle }}</h2>
      </div>

      <div class="horizontal-scroll">
        <div *ngFor="let book of books" class="trending-card"
          (click)="onCardClick(book)"
          [style.cursor]="book.googleBooksId ? 'pointer' : 'default'">
          <img *ngIf="book.coverUrl" class="trending-cover" [src]="book.coverUrl" [alt]="book.title + ' Cover'" loading="lazy" (error)="book.coverUrl = null" />
          <div *ngIf="!book.coverUrl" class="trending-cover trending-cover--empty"></div>
          <div class="trending-info">
            <div class="trending-title">{{ book.title }}</div>
            <div class="trending-author">{{ book.author }}</div>
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

    .trending-section {
      display: flex;
      flex-direction: column;
      gap: clamp(12px, 1.6vw, 20px);
      font-family: var(--ui-sans);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .section-title {
      font-size: clamp(16px, 1.6vw, 20px);
      line-height: 1.2;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.2px;
      margin: 0;
    }

    .horizontal-scroll {
      display: flex;
      gap: clamp(10px, 1.3vw, 16px);
      overflow-x: auto;
      padding-bottom: 24px;

      &::-webkit-scrollbar { height: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 3px;
        &:hover { background: var(--border-strong); }
      }
    }

    .trending-card {
      width: clamp(100px, 11vw, 140px);
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover { transform: translateY(-4px); }
    }

    .trending-cover {
      width: clamp(100px, 11vw, 140px);
      height: clamp(140px, 15.4vw, 196px);
      border-radius: 10px;
      object-fit: cover;
      display: block;
      margin-bottom: 9px;

      &--empty { background: var(--border); }
    }

    .trending-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .trending-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--foreground);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .trending-author {
      font-size: 12px;
      color: var(--muted-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class TrendingBooksComponent {
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  @Input() books: Book[] = [];

  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected get copy() { return HOME_COPY[this.lang]; }

  constructor() {
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed()).subscribe(l => this.lang = l);
  }

  onCardClick(book: Book): void {
    if (book.googleBooksId) {
      this.router.navigate(['/books', book.googleBooksId]);
    }
  }
}
