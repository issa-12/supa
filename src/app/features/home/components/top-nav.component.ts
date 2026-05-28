import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { NotificationsService, AppNotification } from '../../../core/services/notifications.service';
import { NotificationsPanelComponent } from './notifications-panel.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { UserService, UserProfile } from '../../../core/services/user.service';

interface NavSearchBook {
  googleId: string;
  title: string;
  author: string;
  coverUrl: string | null;
}

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe, NotificationsPanelComponent, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="top-nav">
      <div class="brand" routerLink="/">
        <div class="brand-icon">
          <iconify-icon icon="lucide:book-open" style="font-size: 22px"></iconify-icon>
        </div>
        <div class="brand-text">ReadTrack</div>
      </div>

      <!-- Live search -->
      <div class="search-wrap" (click)="$event.stopPropagation()">
        <div class="search-bar-container" [class.focused]="searchOpen">
          <iconify-icon icon="lucide:search" class="search-icon"></iconify-icon>
          <input
            class="search-input"
            type="text"
            placeholder="Search books or users..."
            [(ngModel)]="searchQuery"
            (focus)="onSearchFocus()"
            (input)="onSearchInput()"
            (keydown.enter)="onSearchEnter($event)"
            (keydown.escape)="closeSearch()"
            autocomplete="off"
            spellcheck="false"
          />
          @if (searchLoading) {
            <div class="nav-spinner"></div>
          } @else if (searchQuery) {
            <button class="search-clear" (click)="clearSearch()">
              <iconify-icon icon="lucide:x" style="font-size: 13px"></iconify-icon>
            </button>
          }
        </div>

        @if (searchOpen && searchQuery.length >= 2) {
          <div class="search-dropdown">
            @if (searchLoading) {
              <p class="search-state">Searching…</p>
            } @else if (searchBookResults.length === 0 && searchUserResults.length === 0) {
              <p class="search-state">No results for "{{ searchQuery }}"</p>
            } @else {
              @if (searchUserResults.length > 0) {
                <div class="search-section">
                  <p class="search-section-label">People</p>
                  @for (user of searchUserResults; track user.id) {
                    <button class="search-item" (click)="goToUser(user)">
                      <img
                        [src]="user.avatarUrl || 'https://ui-avatars.com/api/?name=' + user.name[0] + '&background=E9783F&color=fff&size=32'"
                        [alt]="user.name"
                        class="item-avatar"
                        loading="lazy"
                      />
                      <span class="item-name">{{ user.name }}</span>
                    </button>
                  }
                </div>
              }
              @if (searchBookResults.length > 0) {
                <div class="search-section">
                  <p class="search-section-label">Books</p>
                  @for (book of searchBookResults; track book.googleId) {
                    <button class="search-item" (click)="goToBook(book)">
                      @if (book.coverUrl) {
                        <img [src]="book.coverUrl" [alt]="book.title" class="item-cover" loading="lazy" />
                      } @else {
                        <div class="item-cover item-cover--empty">
                          <iconify-icon icon="lucide:book" style="font-size: 14px"></iconify-icon>
                        </div>
                      }
                      <div class="item-info">
                        <span class="item-title">{{ book.title }}</span>
                        <span class="item-author">{{ book.author }}</span>
                      </div>
                    </button>
                  }
                </div>
              }
              <a
                class="search-see-all"
                routerLink="/books/search"
                [queryParams]="{ q: searchQuery }"
                (click)="closeSearch()"
              >
                See all book results
                <iconify-icon icon="lucide:arrow-right" style="font-size: 13px"></iconify-icon>
              </a>
            }
          </div>
        }
      </div>

      <div class="nav-actions">
        <a routerLink="/shelf" class="nav-icon-btn" aria-label="My Shelf">
          <iconify-icon icon="lucide:library" style="font-size: 20px"></iconify-icon>
        </a>

        <a routerLink="/community" class="nav-icon-btn" aria-label="Community">
          <iconify-icon icon="lucide:users" style="font-size: 20px"></iconify-icon>
        </a>

        <a routerLink="/stats" class="nav-icon-btn" aria-label="Stats">
          <iconify-icon icon="lucide:bar-chart-2" style="font-size: 20px"></iconify-icon>
        </a>

        <div class="bell-wrapper">
          <button class="nav-icon-btn" aria-label="Notifications" (click)="togglePanel()">
            <iconify-icon icon="lucide:bell" style="font-size: 20px"></iconify-icon>
            @if (unreadCount$ | async; as count) {
              @if (count > 0) {
                <div class="notification-badge">{{ count > 9 ? '9+' : count }}</div>
              }
            }
          </button>

          @if (panelOpen) {
            <app-notifications-panel
              [notifications]="notifications"
              [isLoading]="panelLoading"
              (close)="closePanel()"
            />
          }
        </div>

        <div class="avatar-wrap" (click)="$event.stopPropagation()">
          <img
            [src]="avatarUrl || 'https://ui-avatars.com/api/?name=R&background=E9783F&color=fff&size=44'"
            alt="Profile"
            class="nav-avatar"
            (click)="toggleUserMenu()"
          />
          @if (userMenuOpen) {
            <div class="user-menu">
              <a class="user-menu-item" routerLink="/profile" (click)="userMenuOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                My Profile
              </a>
              <div class="user-menu-divider"></div>
              <button class="user-menu-item user-menu-item--danger" (click)="logout()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 40px;
      background: var(--background);
      border-bottom: 1px solid var(--border);
      position: relative;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      white-space: nowrap;
      cursor: pointer;
      text-decoration: none;
      color: inherit;

      &:hover { opacity: 0.8; }
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
       }

    .brand-text {
      font-size: 28px;
      font-weight: 700;
      color: var(--foreground);
      letter-spacing: -0.5px;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 500px;
      margin: 0 40px;
    }

    .search-bar-container {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 10px 20px;
       transition: border-color 0.2s;

      &.focused, &:focus-within {
        border-color: rgba(217, 119, 87, 0.4);
         }
    }

    .search-icon {
      width: 18px;
      height: 18px;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    .search-input {
      font-size: 15px;
      color: var(--foreground);
      font-weight: 500;
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-family: inherit;
      min-width: 0;

      &::placeholder { color: var(--muted-foreground); font-weight: 500; }
    }

    .nav-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(217, 119, 87, 0.2);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    .search-clear {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 0;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      &:hover { color: var(--foreground); }
    }

    .search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      z-index: 300;
      overflow: hidden;
    }

    .search-state {
      font-size: 13px;
      color: var(--muted-foreground);
      padding: 16px 20px;
      margin: 0;
      text-align: center;
    }

    .search-section {
      padding: 8px 0;
      & + & { border-top: 1px solid var(--border); }
    }

    .search-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--muted-foreground);
      padding: 4px 16px 6px;
      margin: 0;
    }

    .search-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.12s;

      &:hover { background: var(--primary-soft); }
    }

    .item-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .item-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
    }

    .item-cover {
      width: 30px;
      height: 42px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;

      &--empty {
        background: var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted-foreground);
      }
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .item-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-author {
      font-size: 11px;
      color: var(--muted-foreground);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-see-all {
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: center;
      padding: 12px 16px;
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
      border-top: 1px solid var(--border);
      transition: background 0.12s;

      &:hover { background: var(--primary-soft); }
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .nav-icon-btn {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--foreground);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover { background: var(--surface); }
      &:active { transform: scale(0.95); }
    }

    .bell-wrapper {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: var(--destructive);
      border-radius: 999px;
      border: 2px solid var(--background);
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .avatar-wrap {
      position: relative;
    }

    .nav-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--surface);
       cursor: pointer;
      transition: all 0.2s ease;
      display: block;

      &:hover { transform: scale(1.05);  }
    }

    .user-menu {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      min-width: 180px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      z-index: 200;
      overflow: hidden;
      padding: 4px 0;
    }

    .user-menu-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      background: none;
      border: none;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: var(--border); }
      &--danger { color: #dc2626; &:hover { background: rgba(220, 38, 38, 0.07); } }
    }

    .user-menu-divider {
      height: 1px;
      background: var(--border);
      margin: 4px 0;
    }


    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .top-nav { padding: 12px 20px; gap: 16px; }
      .search-wrap { max-width: 220px; margin: 0 12px; }
      .brand-text { font-size: 24px; }
    }
  `],
})
export class TopNavComponent implements OnInit, OnDestroy {
  private readonly notificationsService = inject(NotificationsService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly unreadCount$ = this.notificationsService.unreadCount$;
  notifications: AppNotification[] = [];
  panelOpen = false;
  panelLoading = false;
  avatarUrl: string | null = null;
  userMenuOpen = false;

  searchQuery = '';
  searchOpen = false;
  searchLoading = false;
  searchBookResults: NavSearchBook[] = [];
  searchUserResults: UserProfile[] = [];

  private sub?: Subscription;
  private searchTimer?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    this.sub = this.notificationsService.notifications$.subscribe((n) => {
      this.notifications = n;
    });

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', user.id)
        .maybeSingle();

      this.avatarUrl = profile?.['profile_picture_url'] ?? null;

      await Promise.all([
        this.notificationsService.loadUnreadCount(),
        this.notificationsService.subscribeToRealtime(user.id),
      ]);
    } catch {
      // non-critical — nav still works
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.notificationsService.unsubscribe();
    clearTimeout(this.searchTimer);
  }

  async togglePanel(): Promise<void> {
    if (this.panelOpen) { this.closePanel(); return; }
    this.panelOpen = true;
    this.panelLoading = true;
    await this.notificationsService.loadNotifications();
    this.panelLoading = false;
  }

  closePanel(): void {
    this.panelOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.userMenuOpen = false;
    this.searchOpen = false;
  }

  onSearchFocus(): void {
    this.searchOpen = true;
    if (this.searchQuery.length >= 2 && this.searchBookResults.length === 0 && this.searchUserResults.length === 0) {
      void this.runSearch();
    }
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchBookResults = [];
    this.searchUserResults = [];
    if (this.searchQuery.length < 2) return;
    this.searchLoading = true;
    this.searchTimer = setTimeout(() => void this.runSearch(), 350);
  }

  private async runSearch(): Promise<void> {
    const q = this.searchQuery.trim();
    if (q.length < 2) return;
    this.searchLoading = true;
    try {
      const [booksRes, users] = await Promise.all([
        fetch(`/api/books/search?q=${encodeURIComponent(q)}&maxResults=4`).then((r) => r.json() as Promise<{ books?: Array<{ googleId: string; title: string; author: string; coverUrl: string | null }> }>),
        firstValueFrom(this.userService.searchUsers(q, 3)),
      ]);
      this.searchBookResults = (booksRes.books ?? []).slice(0, 4).map((b) => ({
        googleId: b.googleId,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
      }));
      this.searchUserResults = users;
    } catch {
      // non-critical
    } finally {
      this.searchLoading = false;
    }
  }

  onSearchEnter(event: Event): void {
    event.preventDefault();
    const q = this.searchQuery.trim();
    if (q) {
      this.closeSearch();
      this.router.navigate(['/books/search'], { queryParams: { q } });
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchBookResults = [];
    this.searchUserResults = [];
  }

  closeSearch(): void {
    this.searchOpen = false;
  }

  goToBook(book: NavSearchBook): void {
    this.closeSearch();
    this.router.navigate(['/books', book.googleId]);
  }

  goToUser(user: UserProfile): void {
    this.closeSearch();
    this.router.navigate(['/profile', user.id]);
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) this.panelOpen = false;
  }

  async logout(): Promise<void> {
    this.userMenuOpen = false;
    const supabase = await this.supabaseService.getClient();
    await supabase.auth.signOut();
    this.notificationsService.unsubscribe();
    this.router.navigate(['/']);
  }
}
