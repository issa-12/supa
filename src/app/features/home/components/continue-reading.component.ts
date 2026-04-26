import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ContinueReadingBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  progress: number;
  currentPage: number;
  totalPages: number;
}

@Component({
  selector: 'app-continue-reading',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="continue-reading-section">
      <div class="section-header">
        <div class="section-title-wrap">
          <h2 class="text-h2">Continue Reading</h2>
        </div>
      </div>

      <div class="continue-reading-row">
        <div
          *ngFor="let book of books"
          class="continue-item"
          (mouseenter)="hoveredBook = book.id"
          (mouseleave)="hoveredBook = null"
          [class.mock-hover]="hoveredBook === book.id"
        >
          <img
            class="continue-cover"
            [src]="book.coverUrl"
            [alt]="book.title + ' Cover'"
          />

          <div class="continue-details">
            <div class="continue-text">
              <div class="book-title-min">{{ book.title }}</div>
              <div class="book-author-min">{{ book.author }}</div>
            </div>

            <div class="progress-container">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="book.progress"></div>
              </div>
              <div class="progress-label">
                {{ book.currentPage > 0 ? 'Page ' + book.currentPage + ' / ' + book.totalPages : book.progress + '% completed' }}
              </div>
            </div>
          </div>

          <!-- Hover Overlay -->
          <div class="continue-hover-overlay">
            <button class="btn btn-primary btn-small" (click)="onContinueReading(book)">
              <iconify-icon icon="lucide:book-open" style="font-size: 16px"></iconify-icon>
              Continue reading
            </button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .continue-reading-section {
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

    .continue-reading-row {
      display: flex;
      gap: 32px;
      overflow-x: auto;
      padding: 10px 0 20px;

      &::-webkit-scrollbar {
        height: 6px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(126, 107, 93, 0.2);
        border-radius: 3px;

        &:hover {
          background: rgba(126, 107, 93, 0.4);
        }
      }
    }

    .continue-item {
      display: flex;
      gap: 20px;
      align-items: center;
      width: 340px;
      flex-shrink: 0;
      position: relative;
      padding: 12px;
      border-radius: 12px;
      transition: background-color 0.2s ease;
    }

    .continue-item.mock-hover {
      background: rgba(255, 250, 245, 0.4);
    }

    .continue-cover {
      width: 88px;
      height: 132px;
      border-radius: 4px 6px 6px 4px;
      object-fit: cover;
      box-shadow: 0 8px 16px rgba(51, 38, 29, 0.12);
      flex-shrink: 0;
    }

    .continue-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }

    .continue-text {
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

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: rgba(126, 107, 93, 0.15);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .progress-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary);
    }

    .continue-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 250, 245, 0.85);
      backdrop-filter: blur(4px);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      border: 1px solid transparent;
    }

    .continue-item.mock-hover .continue-hover-overlay {
      opacity: 1;
      box-shadow: 0 12px 24px rgba(51, 38, 29, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.6);
    }

    .btn {
      min-height: 36px;
      padding: 0 16px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
      color: var(--primary-foreground);
      box-shadow: 0 12px 24px rgba(233, 120, 63, 0.22);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 32px rgba(233, 120, 63, 0.3);
      }

      &:active {
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .continue-reading-row {
        gap: 16px;
      }

      .continue-item {
        width: 100%;
      }

      .text-h2 {
        font-size: 22px;
      }
    }
  `],
})
export class ContinueReadingComponent {
  @Input() books: ContinueReadingBook[] = [];
  @Output() continueReading = new EventEmitter<ContinueReadingBook>();

  hoveredBook: string | null = null;

  onContinueReading(book: ContinueReadingBook): void {
    this.continueReading.emit(book);
  }
}
