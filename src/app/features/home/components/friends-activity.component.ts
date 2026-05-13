import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FriendActivity {
  id: string;
  name: string;
  avatarUrl: string;
  action: string;
  bookTitle?: string;
  rating?: number;
  timestamp: string;
}

@Component({
  selector: 'app-friends-activity',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <aside class="side-col">
      <div class="section-header">
        <h3 class="text-h3">Friends Activity</h3>
      </div>

      <div class="friends-list">
        <div class="friend-activity-item">
          <img
            src="https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F18-25%2FEuropean%2F3"
            alt="Sarah"
            class="friend-avatar"
          />
          <div class="friend-activity-content">
            <div class="friend-activity-text">
              <span class="friend-name">Sarah</span> rated
              <span class="friend-book-title">Dune</span>
              <div class="book-rating-inline" style="display: inline-flex; margin-left: 4px; vertical-align: middle">
                <iconify-icon icon="lucide:star" class="star-icon" style="font-size: 12px"></iconify-icon>
                <iconify-icon icon="lucide:star" class="star-icon" style="font-size: 12px"></iconify-icon>
                <iconify-icon icon="lucide:star" class="star-icon" style="font-size: 12px"></iconify-icon>
                <iconify-icon icon="lucide:star" class="star-icon" style="font-size: 12px"></iconify-icon>
                <iconify-icon icon="lucide:star" class="star-icon" style="font-size: 12px"></iconify-icon>
              </div>
            </div>
            <div class="friend-time">2 hours ago</div>
          </div>
        </div>

        <div class="friend-activity-item">
          <img
            src="https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F25-35%2FNorth%20American%2F1"
            alt="John"
            class="friend-avatar"
          />
          <div class="friend-activity-content">
            <div class="friend-activity-text">
              <span class="friend-name">John</span> started reading
              <span class="friend-book-title">The Secret History</span>
            </div>
            <div class="friend-time">5 hours ago</div>
          </div>
        </div>

        <div class="friend-activity-item">
          <img
            src="https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F35-50%2FAsian%2F4"
            alt="Emma"
            class="friend-avatar"
          />
          <div class="friend-activity-content">
            <div class="friend-activity-text">
              <span class="friend-name">Emma</span> added 3 books to her
              <span class="friend-book-title">TBR</span> list
            </div>
            <div class="friend-time">Yesterday</div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .side-col {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .text-h3 {
      font-size: 20px;
      line-height: 1.25;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.2px;
      margin: 0;
    }

    .friends-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .friend-activity-item {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 12px;
      border-radius: 8px;
      transition: background-color 0.2s ease;

      &:hover {
        background: rgba(255, 250, 245, 0.4);
      }
    }

    .friend-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(51, 38, 29, 0.1);
    }

    .friend-activity-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .friend-activity-text {
      font-size: 14px;
      line-height: 1.5;
      color: var(--foreground);
      word-break: break-word;
    }

    .friend-name {
      font-weight: 700;
    }

    .friend-book-title {
      font-weight: 600;
      font-style: italic;
      color: var(--muted-foreground);
    }

    .friend-time {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .book-rating-inline {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .star-icon {
      color: var(--warning);
    }

    @media (max-width: 1024px) {
      .side-col {
        display: none;
      }
    }
  `],
})
export class FriendsActivityComponent {
  // Mock data - replace with real API calls
  activities: FriendActivity[] = [
    {
      id: '1',
      name: 'Sarah',
      avatarUrl: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F18-25%2FEuropean%2F3',
      action: 'rated',
      bookTitle: 'Dune',
      rating: 5,
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      name: 'John',
      avatarUrl: 'https://storage.googleapis.com/banani-avatars/avatar%2Fmale%2F25-35%2FNorth%20American%2F1',
      action: 'started reading',
      bookTitle: 'The Secret History',
      timestamp: '5 hours ago',
    },
    {
      id: '3',
      name: 'Emma',
      avatarUrl: 'https://storage.googleapis.com/banani-avatars/avatar%2Ffemale%2F35-50%2FAsian%2F4',
      action: 'added to TBR',
      bookTitle: 'Multiple books',
      timestamp: 'Yesterday',
    },
  ];
}
