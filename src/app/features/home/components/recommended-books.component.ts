import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
          <h2 class="text-h2">Recommended for You</h2>
          <span class="eyebrow">Based on your favorite genres</span>
        </div>
      </div>

      <div class="horizontal-scroll">
        <div
          *ngFor="let book of books"
          class="book-card-clean"
          (mouseenter)="hoveredBookId = book.id"
          (mouseleave)="hoveredBookId = null"
          [class.zoomed]="hoveredBookId === book.id"
          (click)="onCardClick(book)"
          [style.cursor]="book.googleBooksId ? 'pointer' : 'default'"
        >
          <div class="book-cover-wrapper">
            <img *ngIf="book.coverUrl" class="book-cover-clean" [src]="book.coverUrl" [alt]="book.title + ' Cover'" loading="lazy" (error)="book.coverUrl = null" />
            <div *ngIf="!book.coverUrl" class="book-cover-clean book-cover--empty"></div>
            <button class="quick-add-btn" (click)="$event.stopPropagation(); onCardClick(book)" aria-label="View book details">
              <iconify-icon icon="lucide:eye" style="font-size: 16px"></iconify-icon>
            </button>
          </div>

          <div class="book-info-minimal">
            <div class="book-title-min">{{ book.title }}</div>
            <div class="book-author-min">{{ book.author }}</div>
            <div class="book-rating-inline" *ngIf="book.rating">
              <iconify-icon icon="lucide:star" class="star-icon" style="font-size: 14px"></iconify-icon>
              {{ book.rating }}
            </div>
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
      position: relative;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .book-card-clean.zoomed {
      transform: scale(1.02);
    }

    .book-card-clean.zoomed .book-cover-clean {
      transform: scale(1.04);
       }

    .book-card-clean.zoomed .quick-add-btn {
      opacity: 1;
    }

    .book-cover-wrapper {
      position: relative;
      overflow: hidden;
      border-radius: 6px 10px 10px 6px;
    }

    .book-cover-clean {
      width: 150px;
      height: 225px;
      border-radius: 6px 10px 10px 6px;
      object-fit: cover;
       &.book-cover--empty {
        background: var(--border);
      }
      display: block;
      transition: transform 0.3s ease;
    }

    .quick-add-btn {
      position: absolute;
      top: 12px;
      right: -12px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
       opacity: 0;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
         }

      &:active {
        transform: scale(0.95);
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

    .book-rating-inline {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: var(--muted-foreground);
    }

    .star-icon {
      color: var(--warning);
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

  @Input() books: Book[] = [];
  @Output() addBook = new EventEmitter<Book>();

  hoveredBookId: string | null = null;

  onCardClick(book: Book): void {
    if (book.googleBooksId) {
      this.router.navigate(['/books', book.googleBooksId]);
    }
  }

  onAddBook(book: Book): void {
    this.addBook.emit(book);
  }
}
