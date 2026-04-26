import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

@Component({
  selector: 'app-trending-books',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <section class="trending-section">
      <div class="section-header">
        <div class="section-title-wrap">
          <h2 class="text-h2">Trending This Week</h2>
        </div>
        <div class="tag-list">
          <span class="small-tag">Popular</span>
          <span class="small-tag">Top Rated</span>
        </div>
      </div>

      <div class="horizontal-scroll">
        <div *ngFor="let book of books" class="book-card-clean">
          <img class="book-cover-clean" [src]="book.coverUrl" [alt]="book.title + ' Cover'" />
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

    .trending-section {
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

    .tag-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .small-tag {
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(126, 107, 93, 0.1);
      color: var(--secondary-foreground);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
        background: rgba(126, 107, 93, 0.2);
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
      box-shadow: 0 10px 24px rgba(51, 38, 29, 0.12);
      display: block;
      transition: box-shadow 0.2s ease;

      .book-card-clean:hover & {
        box-shadow: 0 16px 32px rgba(51, 38, 29, 0.18);
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

      .tag-list {
        display: none;
      }
    }
  `],
})
export class TrendingBooksComponent {
  @Input() books: Book[] = [];
}
