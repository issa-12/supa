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
  rating?: number;
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
          <h2 class="text-h2">{{ copy.recommendedTitle }}</h2>
          <span class="eyebrow">{{ copy.recommendedSubtitle }}</span>
        </div>
      </div>

      <div class="horizontal-scroll">
        <div *ngFor="let book of books" class="book-card-clean"
          (click)="onCardClick(book)"
          [style.cursor]="book.googleBooksId ? 'pointer' : 'default'">
          <img *ngIf="book.coverUrl" class="book-cover-clean" [src]="book.coverUrl" [alt]="book.title + ' Cover'" loading="lazy" (error)="book.coverUrl = null" />
          <div *ngIf="!book.coverUrl" class="book-cover-clean book-cover--empty"></div>
          <div class="book-info-minimal">
            <div class="book-title-min">{{ book.title }}</div>
            <div class="book-author-min">{{ book.author }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .recommended-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
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
      gap: 6px;
    }

    .text-h2 {
      font-size: 26px;
      line-height: 1.2;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.4px;
      margin: 0;
    }

    .eyebrow {
      font-size: 12px;
      line-height: 1.4;
      letter-spacing: 0.8px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      white-space: nowrap;
    }

    .horizontal-scroll {
      display: flex;
      gap: 24px;
      overflow-x: auto;
      padding: 10px 0 30px;
      margin: -10px 0 -30px;

      &::-webkit-scrollbar {
        height: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border);
        border-radius: 3px;

        &:hover {
          background: rgba(126, 107, 93, 0.4);
        }
      }
    }

    .book-card-clean {
      width: 150px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex-shrink: 0;
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-4px);
      }
    }

    .book-cover-clean {
      width: 150px;
      height: 225px;
      border-radius: 6px 10px 10px 6px;
      object-fit: cover;
      display: block;

      &.book-cover--empty {
        background: var(--border);
      }
    }

    .book-info-minimal {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .book-title-min {
      font-size: 15px;
      font-weight: 700;
      color: var(--foreground);
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .book-author-min {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
      .horizontal-scroll {
        gap: 16px;
      }

      .book-card-clean {
        width: 130px;
      }

      .book-cover-clean {
        width: 130px;
        height: 195px;
      }

      .text-h2 {
        font-size: 22px;
      }
    }
  `],
})
export class RecommendedBooksComponent {
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
