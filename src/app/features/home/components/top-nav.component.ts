import { Component, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, HostListener, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationsService, AppNotification } from '../../../core/services/notifications.service';
import { NotificationsPanelComponent } from './notifications-panel.component';
import { SupabaseService } from '../../../core/services/supabase.service';
import { UserService, UserProfile } from '../../../core/services/user.service';
import { TranslationService, LanguageSelectorComponent, LANGUAGE_OPTIONS, LanguageOption, NAV_COPY, LanguageCode } from '../../../i18n';

interface NavSearchBook {
  googleId: string;
  title: string;
  author: string;
  coverUrl: string | null;
}

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AsyncPipe, NotificationsPanelComponent, FormsModule, LanguageSelectorComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="top-nav">
      <div class="brand" routerLink="/home">
        <div class="brand-icon">
          <iconify-icon icon="lucide:book-open" style="font-size: 22px"></iconify-icon>
        </div>
        <div class="brand-text">ReadTrack</div>
      </div>

      @if (!hideSearch) {
        <!-- Live search -->
        <div class="search-wrap" (click)="$event.stopPropagation()">
          <div class="search-bar-container" [class.focused]="searchOpen">
            <iconify-icon icon="lucide:search" class="search-icon"></iconify-icon>
            <input
              class="search-input"
              type="text"
              [placeholder]="copy.searchPlaceholder"
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
                <p class="search-state">{{ copy.searchingState }}</p>
              } @else if (searchBookResults.length === 0 && searchUserResults.length === 0) {
                <p class="search-state">{{ copy.searchNoResults.replace('{{ query }}', searchQuery) }}</p>
              } @else {
                @if (searchUserResults.length > 0) {
                  <div class="search-section">
                    <p class="search-section-label">{{ copy.searchSectionPeople }}</p>
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
                    <p class="search-section-label">{{ copy.searchSectionBooks }}</p>
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
                  {{ copy.searchSeeAll }}
                  <iconify-icon icon="lucide:arrow-right" style="font-size: 13px"></iconify-icon>
                </a>
              }
            </div>
          }
        </div>
      }

      <div class="nav-actions">
        <a routerLink="/home" routerLinkActive="nav-icon-btn--active" class="nav-icon-btn" [attr.aria-label]="copy.homeAriaLabel">
          <iconify-icon icon="lucide:home" style="font-size: 20px"></iconify-icon>
        </a>

        <a routerLink="/shelf" routerLinkActive="nav-icon-btn--active" class="nav-icon-btn" [attr.aria-label]="copy.myShelfAriaLabel">
          <iconify-icon icon="lucide:library" style="font-size: 20px"></iconify-icon>
        </a>

        <a routerLink="/community" routerLinkActive="nav-icon-btn--active" class="nav-icon-btn" [attr.aria-label]="copy.communityAriaLabel">
          <iconify-icon icon="lucide:users" style="font-size: 20px"></iconify-icon>
        </a>

        <a routerLink="/stats" routerLinkActive="nav-icon-btn--active" class="nav-icon-btn" [attr.aria-label]="copy.statsAriaLabel">
          <iconify-icon icon="lucide:bar-chart-2" style="font-size: 20px"></iconify-icon>
        </a>

        <div class="bell-wrapper">
          <button class="nav-icon-btn" [attr.aria-label]="copy.notificationsAriaLabel" (click)="togglePanel()">
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
              [loadError]="panelError"
              (close)="closePanel()"
              (reload)="loadPanel()"
            />
          }
        </div>

        <app-language-selector
          class="nav-language-selector"
          [languages]="languages"
          [selectedLanguage]="selectedLanguage"
          [compact]="false"
        />

        <div class="avatar-wrap" [class.avatar-wrap--active]="isProfileActive" (click)="$event.stopPropagation()">
          @if (isProfileActive) {
            <span class="avatar-active-label">{{ copy.myProfile }}</span>
          }
          <img
            [src]="avatarUrl || avatarFallback"
            alt="Profile"
            class="nav-avatar"
            [attr.aria-current]="isProfileActive ? 'page' : null"
            (click)="toggleUserMenu()"
          />
          @if (userMenuOpen) {
            <div class="user-menu">
              <a class="user-menu-item" routerLink="/profile" (click)="userMenuOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {{ copy.myProfile }}
              </a>
              <a class="user-menu-item" routerLink="/settings/api-keys" (click)="userMenuOpen = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
                {{ copy.apiKeys }}
              </a>
              <div class="user-menu-divider"></div>
              <button class="user-menu-item user-menu-item--danger" (click)="logout()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {{ copy.logout }}
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
      --ui-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .top-nav {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 0 40px;
      height: 62px;
      // Frosted glass: translucent cream + blur. rgb of --background (#f4ede5).
      background: rgba(244, 237, 229, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 50;
      font-family: var(--ui-sans);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
      cursor: pointer;
      text-decoration: none;
      color: inherit;

      &:hover { opacity: 0.8; }
    }

    .brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .brand-text {
      font-size: 18px;
      font-weight: 600;
      color: var(--foreground);
      letter-spacing: -0.3px;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 420px;
      margin: 0 auto;
    }

    .search-bar-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 8px 18px;
      box-shadow: 0 1px 4px rgba(60, 30, 10, 0.06);
      transition: border-color 0.2s;

      &.focused, &:focus-within {
        border-color: rgba(217, 119, 87, 0.4);
      }
    }

    .search-icon {
      width: 16px;
      height: 16px;
      color: var(--muted-foreground);
      flex-shrink: 0;
    }

    .search-input {
      font-size: 14px;
      color: var(--foreground);
      font-weight: 500;
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-family: inherit;
      min-width: 0;

      &::placeholder { color: var(--muted-foreground); font-weight: 400; }
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
      gap: 6px;
      margin-inline-start: auto;
    }

    .nav-icon-btn {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      text-decoration: none;

      &:hover { background: var(--surface-alt); color: var(--foreground); }
      &:active { transform: scale(0.95); }

      // Active route: terracotta icon + a small dot underneath.
      &--active {
        color: var(--primary);
        background: var(--primary-soft);
      }
      &--active::after {
        content: '';
        position: absolute;
        bottom: 3px;
        left: 50%;
        transform: translateX(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--primary);
      }
    }

    .bell-wrapper {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: 4px;
      inset-inline-end: 4px;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      background: var(--primary);
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
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar-active-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary);
      white-space: nowrap;
    }

    .nav-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--surface-alt);
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      display: block;
      margin-inline-start: 6px;

      &:hover { transform: scale(1.05); }
    }

    // On the profile page: terracotta ring around the avatar to signal "you are here".
    .avatar-wrap--active .nav-avatar {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--primary-soft);
    }

    .user-menu {
      position: absolute;
      top: calc(100% + 10px);
      inset-inline-end: 0;
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

    .nav-language-selector {
      display: flex;
      align-items: center;

      // The shared selector defaults to --auth-foreground (only defined on the
      // auth pages) and a 46px tall, 162px wide control. Re-shape it to a compact
      // icon-only button (globe only — no language label or chevron) that matches
      // the other nav icons and turns terracotta on hover.
      ::ng-deep .language-button {
        width: 40px;
        height: 40px;
        min-width: auto;
        padding: 0;
        gap: 0;
        border-radius: 9px;
        border: none;
        background: transparent;
        color: var(--muted-foreground);
        transition: background 0.15s, color 0.15s;

        // Hide the language name and the dropdown chevron — keep just the globe.
        span:not([class]) { display: none; }
        .language-button__chevron { display: none; }
        // Size the globe to match the other 20px nav icons.
        svg { width: 19px; height: 19px; }

        &:hover {
          background: var(--surface-alt);
          color: var(--foreground);
        }
        &:active { transform: scale(0.95); }
      }
    }


    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .top-nav {
        flex-wrap: wrap;
        height: auto;
        padding: 10px 16px;
        gap: 10px;
      }
      /* logo mark only — the word-mark eats too much width on phones */
      .brand-text { display: none; }
      .nav-actions { gap: 4px; }
      /* keep just the terracotta ring on phones — the text label eats width */
      .avatar-active-label { display: none; }
      /* search drops onto its own full-width row so the action icons fit */
      .search-wrap {
        order: 3;
        flex-basis: 100%;
        max-width: 100%;
        margin: 0;
      }
    }

    @media (max-width: 420px) {
      .top-nav { padding: 8px 12px; }
      .nav-icon-btn { width: 34px; height: 34px; }
    }
  `],
})
export class TopNavComponent implements OnInit, OnDestroy {
  @Input() hideSearch = false;
  private readonly notificationsService = inject(NotificationsService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly unreadCount$ = this.notificationsService.unreadCount$;
  notifications: AppNotification[] = [];
  panelOpen = false;
  panelLoading = false;
  panelError = false;
  avatarUrl: string | null = null;
  userName = '';
  userMenuOpen = false;

  get avatarFallback(): string {
    const initial = encodeURIComponent(this.userName?.[0]?.toUpperCase() || 'U');
    return `https://ui-avatars.com/api/?name=${initial}&background=E9783F&color=fff&size=44`;
  }

  // The avatar is the entry point to YOUR OWN profile, so highlight it
  // (terracotta ring + label) only on the bare /profile route. Another user's
  // profile is /profile/:id and must not light it up. router.url updates on
  // NavigationEnd, which triggers change detection, so this getter stays live.
  get isProfileActive(): boolean {
    return this.router.url.split('?')[0].split('#')[0] === '/profile';
  }

  // Language support
  protected lang: LanguageCode = this.translationService.getCurrentLanguage();
  protected selectedLanguage: LanguageOption = LANGUAGE_OPTIONS.find(l => l.code === this.lang) || LANGUAGE_OPTIONS[0];
  protected languages = LANGUAGE_OPTIONS;

  searchQuery = '';
  searchOpen = false;
  searchLoading = false;
  searchBookResults: NavSearchBook[] = [];
  searchUserResults: UserProfile[] = [];

  protected get copy() { return NAV_COPY[this.lang]; }

  private sub?: Subscription;
  private searchTimer?: ReturnType<typeof setTimeout>;

  async ngOnInit(): Promise<void> {
    // Subscribe to language changes. takeUntilDestroyed() runs here in ngOnInit
    // (outside the injection context), so it needs an explicit DestroyRef.
    this.translationService.getCurrentLanguage$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(lang => {
      this.lang = lang;
      this.selectedLanguage = LANGUAGE_OPTIONS.find(l => l.code === lang) || LANGUAGE_OPTIONS[0];
    });

    this.sub = this.notificationsService.notifications$.subscribe((n) => {
      this.notifications = n;
    });

    this.userService.currentUserAvatar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(url => { this.avatarUrl = url; });

    try {
      const supabase = await this.supabaseService.getClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('profile_picture_url, name')
        .eq('id', user.id)
        .maybeSingle();

      this.userName = profile?.['name'] ?? '';
      const avatarUrl = profile?.['profile_picture_url'] ?? null;
      this.userService.setCurrentUserAvatar(avatarUrl);

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
    await this.loadPanel();
  }

  async loadPanel(): Promise<void> {
    this.panelLoading = true;
    this.panelError = false;
    const ok = await this.notificationsService.loadNotifications();
    this.panelError = !ok;
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
