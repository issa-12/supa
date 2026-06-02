# ReadTrack — Claude Code Handoff

## What this project is
ReadTrack is a social reading app (think Goodreads) built in a 15-day sprint, plus post-sprint enhancements.
Users can search books via Google Books, manage a personal shelf, follow friends,
post about books in a community feed with content moderation, and receive AI-powered reading recommendations.

**Current day: 15 of 15. All 15 days complete. Project is production-ready.**

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19 SPA (no SSR), standalone components, SCSS |
| Backend | NestJS v10 in `backend/` folder, global prefix `api`, port 3000 |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth — email OTP signup, Google OAuth, 2FA |
| Deployment | Docker — nginx (frontend) + NestJS (backend) containers |
| Dev proxy | `proxy.conf.json` forwards `/api/*` → `localhost:3000` |

**Supabase project URL:** `https://qgoermeodyyfrfoyvnvo.supabase.co`

---

## Running the project

### With Docker (recommended)
```bash
docker compose up --build
# Frontend → http://localhost:4200
# Backend  → http://localhost:3000
```

### Local dev (two terminals)
```bash
# Terminal 1 — Angular
npm start

# Terminal 2 — NestJS
cd backend && npm run start:dev
```

Or with concurrently (after `npm install`):
```bash
npm run dev
```

---

## Project structure

```
supa/
├── src/                          # Angular SPA
│   └── app/
│       ├── core/
│       │   ├── guards/           # authGuard, genreOnboardingGuard
│       │   └── services/
│       │       ├── supabase.service.ts
│       │       ├── book.service.ts
│       │       ├── user.service.ts
│       │       └── activity.service.ts
│       └── features/
│           ├── auth/             # Login + Signup page
│           ├── auth-callback/    # Google OAuth callback
│           ├── email-verification/ # OTP entry
│           ├── onboarding/       # Genre picker (post-signup)
│           ├── home/             # Home page + sub-components
│           ├── profile/          # User profile page
│           ├── books/            # Book search + Book detail
│           └── shelf/            # My shelf page
├── backend/                      # NestJS backend
│   └── src/
│       ├── auth/                 # /api/auth/* endpoints
│       ├── books/                # /api/books/search, /api/books/:googleId
│       └── supabase/             # Global SupabaseService (admin + anon clients)
├── supabase/
│   └── migrations/               # All DB schema + RLS migrations
├── .env                          # Root env (used by Docker / docker-compose)
├── backend/.env                  # Backend env (used by local NestJS dev)
├── proxy.conf.json               # Angular dev server proxy
├── docker-compose.yml
└── nginx.conf
```

---

## Environment variables

Both `.env` files are gitignored. They contain:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_OTP_FUNCTION_URL=
GOOGLE_BOOKS_API_KEY=         # Google Books API — 1000 req/day
FRONTEND_URL=http://localhost:4200
PORT=3000
```

The root `.env` is read by `docker-compose.yml` (`env_file: - .env`).
`backend/.env` is loaded by NestJS `main.ts` at startup.

---

## Database schema (key tables)

```sql
public.users          -- mirrors auth.users (id = auth.uid())
public.profiles       -- extended profile data
public.books          -- shared book catalog (google_books_id UNIQUE)
public.user_books     -- user shelf (user_id, book_id, status_id, rating, note, review_text, current_page, total_pages)
public.reading_statuses  -- reference: read / want_to_read / currently_reading
public.reading_goals  -- annual reading goal per user
public.genres         -- 20 genres seeded
public.user_genres    -- many-to-many user ↔ genre
public.posts          -- community posts (tied to a book)
public.comments       -- threaded (parent_comment_id, depth 0-3)
public.post_likes / comment_likes
public.friendship     -- user_id1, user_id2, status_id, requester_id
public.friendship_status  -- pending / accepted / rejected / blocked
public.notifications
public.notifications_type
public.ai_recommendations -- cached Claude recommendations per user (JSONB, expires_at TTL 24h)
```

**Important:** `reading_statuses` IDs are NOT hardcoded in the app — status IDs
are resolved dynamically by querying by `status_name`. The seeded order is:
1 = read, 2 = want_to_read, 3 = currently_reading, 4 = recommended_by_friend.

---

## RLS policies summary

All tables have RLS enabled. Key rules:
- `users` — SELECT all authenticated, UPDATE own row
- `books` — SELECT/INSERT/UPDATE all authenticated (shared catalog)
- `user_books` — SELECT own or public, INSERT/UPDATE/DELETE own row
- `user_genres` — SELECT all, INSERT/DELETE own row
- `reading_goals` — ALL own row only
- `posts` — SELECT non-deleted, INSERT/UPDATE/DELETE own row
- `comments` — same as posts
- `friendship` — SELECT/UPDATE where user_id1 or user_id2 = auth.uid()
- `notifications` — SELECT/UPDATE own row

---

## Routes (Angular)

| Path | Component | Guards |
|---|---|---|
| `/` | AuthPageComponent (login) | — |
| `/signup` | AuthPageComponent (signup) | — |
| `/auth/callback` | AuthCallbackComponent | — |
| `/verify-email` | EmailVerificationComponent | — |
| `/onboarding/genres` | GenreOnboardingComponent | authGuard |
| `/home` | HomePageComponent | authGuard + genreOnboardingGuard |
| `/profile` | ProfilePageComponent | authGuard + genreOnboardingGuard |
| `/profile/:id` | ProfilePageComponent | authGuard + genreOnboardingGuard |
| `/books/search` | BookSearchComponent | authGuard + genreOnboardingGuard |
| `/books/:googleId` | BookDetailComponent | authGuard + genreOnboardingGuard |
| `/shelf` | ShelfComponent | authGuard + genreOnboardingGuard |
| `/stats` | StatsPageComponent | authGuard + genreOnboardingGuard |
| `/community` | CommunityPageComponent | authGuard + genreOnboardingGuard |
| `/privacy` | PrivacyPolicyComponent | — |
| `/terms` | TermsOfServiceComponent | — |

---

## NestJS endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/request-signup` | Email OTP signup trigger |
| POST | `/api/auth/verify-email` | OTP verify → returns session tokens |
| POST | `/api/auth/resend-verification` | Resend OTP |
| GET | `/api/books/search?q=&maxResults=` | Google Books proxy search |
| GET | `/api/books/:googleId` | Book detail (DB first, then Google fallback) |
| POST | `/api/friends/request` | Send a friend request |
| PATCH | `/api/friends/:id/accept` | Accept an incoming request |
| PATCH | `/api/friends/:id/reject` | Reject an incoming request |
| DELETE | `/api/friends/:id` | Cancel sent request or remove friend |
| GET | `/api/friends` | List accepted friends (auth user) |
| GET | `/api/friends/requests` | List incoming pending requests |
| GET | `/api/friends/status/:userId` | Friendship status with a specific user |
| GET | `/api/recommendations/:userId` | AI book recommendations (Claude, 24h cache) |
| GET | `/api/stats/global?period=week\|month` | Top books, trending genres, top readers |
| GET | `/api/stats/pace` | Authenticated user's monthly reading pace |
| GET | `/api/community/posts?tag=&page=&trending=` | Get all posts or trending posts (with optional tag filter) |
| GET | `/api/community/tags/trending` | Get trending tags across all community posts |
| POST | `/api/community/posts` | Create a new community post (with content moderation) |
| GET | `/api/health` | Health check endpoint for Docker |

---

## What is done (Days 1–12)

### Day 1 — Auth & Onboarding
- Login page: email/password + Google OAuth
- Signup page: email OTP flow (8-digit code, not SMS)
- Email verification page with OTP input + resend
- `verifyEmailCode` sets browser session via `supabase.auth.setSession()`
- Genre onboarding page (must complete before accessing app)
- `authGuard` + `genreOnboardingGuard`
- i18n: English / Arabic (RTL) / French
- 2FA toggle in profile
- Migrations: schema fixes, reading_statuses seeded, RLS all tables, indexes

### Day 2 — Books Search & Catalog
- NestJS backend replacing Angular SSR Express server
- `GET /api/books/search` — proxies Google Books API (no CORS, server-side key)
- `GET /api/books/:googleId` — DB-first, Google fallback
- `BookSearchComponent` — debounced search, results grid, per-card dropdown to add to shelf
- `addGoogleBookToShelf()` — inserts book into shared catalog then adds to user_books
- Google Books API key wired via `GOOGLE_BOOKS_API_KEY` env var
- `books` RLS INSERT + UPDATE policies
- ON DELETE CASCADE: public.users → auth.users, public.profiles → auth.users
- Unique index on user_books(user_id, book_id)

### Day 3 — Shelf & Book Detail
- `ShelfComponent` (`/shelf`) — groups books by status (currently reading → want to read → read)
  - Per-card dropdown: move to other shelf, remove from shelf
- `BookDetailComponent` (`/books/:googleId`) — interactive 5-star rating, add/change/remove shelf status
- Shelf status resolved from DB by name (dynamic, not hardcoded IDs)
- Angular route: `/books/search` must come BEFORE `/books/:googleId` to avoid conflict

### Day 4 — Friends System
- `FriendsModule` in `backend/src/friends/` — full CRUD friend lifecycle
- All 7 NestJS endpoints: send/accept/reject/cancel/list/requests/status
- JWT verified per-request via `supabase.getAdmin().auth.getUser(token)`
- Status IDs resolved dynamically (same pattern as reading_statuses)
- `FriendshipService` in Angular (`src/app/core/services/friendship.service.ts`)
- Profile page: dynamic friend button (Add / Cancel / Accept+Decline / Friends)
- Own profile: pending requests section + friends grid
- Migration: `friendship_unique_pair` index (order-independent duplicate prevention)
- Migration: friendship FKs re-pointed to `public.users` for future join support

### Day 5 — Notifications
- Real-time notifications via Supabase Realtime (`postgres_changes` INSERT on `notifications`)
- Bell icon in top nav with live unread count badge (capped at 9+)
- Notification dropdown panel: actor avatar, action label, time-ago, mark-as-read
- `NotificationsService` (Angular) — `unreadCount$` + `notifications$` as BehaviorSubjects
- `NotificationsModule` (NestJS) — GET /api/notifications, GET /api/notifications/unread-count, PATCH read/read-all
- Notifications fired on: friend request sent, friend request accepted
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications`

### Day 6 — Community Posts
- `PostsFeedComponent` — compose card (collapsed trigger → expanded with textarea + book picker) + live feed
- Book picker searches Google Books API; auto-upserts selected book into `public.books` at post time
- Feed shows current user's posts + all accepted friends' posts, newest first
- Soft-delete (own posts only) with instant UI removal
- `ActivityService` rewritten — batch-fetches authors and books separately (no fragile PostgREST join hints)
- Feed loads via `ngOnChanges` (correctly handles async `currentUserId` input from parent)
- FAB button on home page opens the compose form
- Migrations: `posts.user_id` FK re-pointed to `public.users`; `is_deleted` defaulted to `false`; RLS policy uses `IS NOT TRUE` to handle legacy NULL rows

### Day 7 — Comments & Likes
- `CommentService` — flat DB fetch + client-side tree build (depth 0–3 via `parent_comment_id`)
- `PostCommentsComponent` — threaded comments panel: top-level + replies up to depth 3, inline reply forms
- `LikesService` — `togglePostLike` + `toggleCommentLike`, both with optimistic UI and notification side-effect
- Like counts + `isLikedByMe` batch-fetched in `ActivityService.loadFeed` via `post_likes` join
- Comment likes: `comment_likes` table, batch-fetched in `CommentService.getComments`
- Migrations: RLS for `post_likes`, `comment_likes`; `is_deleted DEFAULT false` for comments

### Day 8 — Community Completion
- **Trending tab**: PostsFeedComponent now has Friends / Trending tab toggle; `getTrendingPosts` fetches last 7 days, sorts client-side by like count
- **Book recommendations**: "Recommend to Friend" button on `BookDetailComponent` → friend picker dropdown → fires `book_recommended` notification to recipient
- **`RecommendationService`**: ensures book is in DB, fires notification via `NotificationsService.fireNotification`
- **Notifications for likes**: `LikesService` fires `post_liked` / `comment_liked` notifications on new likes
- Migrations: `notifications` INSERT RLS (`actor_user_id = auth.uid() AND user_id <> auth.uid()`)

### Day 9 — Profile Enhancements
- **Bug fix**: `getUserReadingStats` was using hardcoded `status_id=2` (= want_to_read) with broken `read_at` filter — fixed to dynamic lookup of 'read' status + filter by `updated_at` this year
- **Reading goal setting**: inline edit on own profile — click "Edit goal", enter number, save → upserts to `reading_goals`
- **Currently Reading section**: shows books with `currently_reading` status on both own and other profiles
- **Recent Posts section**: shows last 5 posts by the user (with like/comment counts)
- `getUserBooksByStatus(userId, statusName, limit)` added to BookService
- `getUserPosts(targetUserId, currentUserId, limit)` added to ActivityService
- `setReadingGoal(userId, year, target)` added to UserService
- Migration: `UNIQUE(user_id, year)` constraint on `reading_goals` for upsert

### Day 10 — AI Recommendations (Claude API)
- `RecommendationsModule` in `backend/src/recommendations/` — `GET /api/recommendations/:userId`
- Pulls user genres + rated books + reading history from Supabase to build prompt context
- Calls `claude-haiku-4-5-20251001` via Anthropic SDK with system prompt cache (`cache_control: ephemeral`)
- Caches results in `ai_recommendations` table (JSONB, 24h TTL) — upsert on re-request
- Enriches each suggestion with Google Books (cover, googleBooksId) and upserts into `public.books`
- Mock fallback (6 hardcoded books) when Anthropic API key is missing or call fails
- Home page `RecommendedBooks` section fetches from endpoint with Bearer token; cards navigate to `/books/:googleBooksId`
- Migration: `ai_recommendations` table with RLS (own rows only)

### Day 11 — Stats Dashboard
- `StatsModule` in `backend/src/stats/` — two endpoints:
  - `GET /api/stats/global?period=week|month` — top books, trending genres, top readers (all in one response)
  - `GET /api/stats/pace` — authenticated user's monthly read count for current year
- **Top Books**: counts `user_books` additions in the period, joins `books` for metadata, returns top 5
- **Trending Genres**: counts `user_genres` selections across all users, returns top 6 with % share
- **Top Readers**: two-query pattern (no PostgREST join — `user_books.user_id` has no FK to `public.users`): count by user_id in JS → separate `.in()` query on `users` table
- **Reading Pace**: monthly breakdown of books marked "read" this year for the current user
- `StatsPageComponent` (`/stats`) — four sections with shimmer skeletons, period toggle, pure CSS bar chart for pace
- Stats nav icon added to top nav (bar-chart-2 icon between Shelf and Bell)
- `backend/test-stats.mjs` — test script verifying all four data queries against live Supabase

### Day 12 — Reading Progress, Notes & Reviews
- **DB migration**: added `current_page INT`, `total_pages INT`, `note TEXT`, `review_text TEXT` columns to `user_books`
- **Reading progress on shelf**: "Currently Reading" cards show a progress bar (fill % = currentPage/totalPages). Click bar or "+ Track progress" → inline form with two number inputs (current page / total pages). Saves with ✓ button, updates local state without re-fetching.
- **Private notes on book detail**: textarea below description (only shown when book is on shelf). Saves to `user_books.note`. "Save Notes" button flashes "Saved!" for 2s.
- **Public review on book detail**: separate textarea saves to `user_books.review_text`. Labeled "visible to your friends".
- **Community reviews section**: two-query fetch (user_books → users) shows other users' avatar, name, star rating, and review text for the same book. Refreshes after saving own review.
- **Bug fix**: Google Books search 502 — changed from throwing `BadGatewayException` to graceful fallback: logs the actual API error, then searches local `books` table by title (`ILIKE`). Never crashes the search page.
- nginx.conf: added `proxy_connect_timeout 10s`, `proxy_read_timeout 30s`, `proxy_send_timeout 30s`

### Day 13 — Search & Shelf Improvements
- **Unified top-nav search**: live dropdown (350ms debounce) shows books + users in parallel; Enter key navigates to `/books/search?q=...`; click outside closes; clear button; responsive (220px on mobile)
- **BookSearchComponent query-param support**: reads `?q=` on init, pre-fills + runs search automatically (enables top-nav "See all results" flow)
- **Shelf filter/sort**: filter pills (All / Reading / Want to Read / Read) + sort select (Date Added / Title A–Z / Rating) — all client-side, no refetch; `displayedSections` getter applies filter then sort

### Day 14 — Polish & Performance
- **Offline detection banner**: global `@HostListener('window:online/offline')` in `App` root; shows a fixed dark banner at the top when offline; checks `navigator.onLine` on init
- **Shelf skeleton**: replaced spinner with shimmer book-card grid (filter bar pills + section header + 6 cover cards) using global `.skeleton` animation
- **Profile skeleton**: replaced spinner with shimmer layout mirroring the profile card (avatar circle, name/username/joined lines, action button, bio lines, genre tags, two stat cards, book grid)
- **Home page skeletons**: added shimmer placeholders for Continue Reading (horizontal card row), Recommended Books (6-tile grid), and Trending Books (6-tile grid) sections; each appears while the corresponding `isLoading*` flag is true, disappears when data arrives; used `*ngIf` to match existing home-page syntax
- **Image lazy loading**: added `loading="lazy"` to all `<img>` tags on profile page (avatar + all book covers across 4 sections); shelf and book search already had it

### Day 15 — Final Deployment
- **NestJS `/api/health` endpoint**: `GET /api/health` returns `{ status: 'ok', timestamp }` — used by Docker healthcheck and monitoring
- **nginx.conf hardening**: gzip compression (level 6, JS/CSS/JSON/SVG/fonts), permanent cache headers for hashed static assets (`Cache-Control: public, immutable, 1y`), no-cache for `index.html`, security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `X-XSS-Protection`)
- **docker-compose.yml hardening**: Docker internal network (`readtrack-net`), healthchecks for both containers (frontend pings nginx, backend pings `/api/health`), `depends_on: condition: service_healthy` so frontend only starts after backend is ready. Backend port `3000` no longer exposed externally — accessible only through nginx proxy.
- **`.env.example` completed**: all 9 required environment variables documented with placeholders

### Post-sprint Bug Fixes (Batch 1)
- **B1 — Continue Reading random progress**: `home-page.component.ts` — replaced `Math.random() * 100` with actual `currentPage / totalPages` calculation from DB. Continue Reading label now shows "Page X / Y" or "No progress tracked yet" instead of a meaningless random percentage.
- **B2 — Hero "View Book" did nothing**: `hero-section.component.ts` — injected `Router`, added `googleBooksId` to local `Book` interface, `onViewBook()` now navigates to `/books/:googleBooksId`.
- **B3 — Hero hardcoded description**: `hero-section.component.ts` — replaced static mystery-novel description with `book.description` (truncated to 220 chars), falling back to a generic message if no description exists. Also propagated `description` through `home-page.component.ts` `mapBook()`.
- **B4 — Hero cover broken image**: `hero-section.component.ts` — added `coverBroken` flag + `(error)` handler; shows a book-icon placeholder when cover URL fails to load. Also added loading state (`addingToReading`) to "Add to Reading" button.
- **B5 — `timeAgo()` negative diff**: Fixed in both `posts-feed.component.ts` and `profile-page.component.ts` — added `if (diff < 0) return 'just now'` guard to prevent NaN/negative values when server clock is slightly ahead.
- **B6 — Progress save allowed invalid values**: `shelf.component.ts` — `saveProgress()` now validates that `currentPage ≤ totalPages` when totalPages is provided, preventing nonsensical progress like "page 500 of 200".
- **B7 — Delete post silent failure**: `posts-feed.component.ts` — changed to optimistic deletion (remove immediately from UI), with full rollback on error. Previously the post stayed visible with no feedback; now it disappears instantly and reappears if the server call fails.
- **B8 — Broken images no fallback**: `posts-feed.component.ts` — added `(error)` handlers to user avatar imgs (`post.userAvatar = null` triggers `@if` to switch to initials fallback), post book cover imgs (`post.bookCover = ''` hides the cover — `bookCover` is typed as `string`, not nullable), and compose avatar.

### Post-sprint Console Error Fixes
- **E1 — `/api/flow-image/` 404**: `home-page.component.scss` — removed stale IDE-generated background image URL from the `::before` pseudo-element. The gradient overlay already provides the warm background; the URL was a no-op placeholder from the IDE.
- **E2 — `book-placeholder.png` 404**: `stats-page.component.html` + `.scss` — replaced `[src]="book.coverUrl || 'assets/book-placeholder.png'"` with `@if/@else` pattern; missing covers render as a styled placeholder `div`. Also fixed same issue in `recommended-books.component.ts`.
- **E3 — Hero/Trending static content**: `home-page.component.ts` — `getFeaturedBook()` was reading the first row of the books table (same for all users). Replaced: `loadRecommendedBooks()` now fetches 7 AI recommendations, uses item 0 as the hero book (personalized per user, real Google Books covers) and items 1–6 as the recommended grid. `getTrendingBooks()` in `book.service.ts` was also reading random DB rows; replaced with a call to `/api/stats/global?period=week` so Trending This Week shows actually popular books. Added `googleBooksId` to the stats backend response so trending cards navigate correctly.

### Post-sprint Missing Features (Batch 1)
- **M1 — Trending book cards not clickable**: `trending-books.component.ts` — injected `Router`, added `googleBooksId` to local `Book` interface, added `(click)="onCardClick(book)"` to the card div. Cards now navigate to `/books/:googleBooksId`. Also added `loading="lazy"` + `(error)` fallback to cover images.
- **M3 — No remove confirmation**: Added `confirm()` dialogs before removing a book from the shelf in both `shelf.component.ts` (`removeFromShelf()`) and `book-detail.component.ts` (`removeFromShelf()`). Prevents accidental shelf removals.
- **M4 — Notes/review textarea no character limit**: `book-detail.component.html` — added `maxlength="500"` on notes textarea, `maxlength="1000"` on review textarea. Added `.textarea-footer` row beneath each with a live character counter (`X/500`) that turns red (`.char-count--warn`) when within 50 chars of the limit. Added corresponding `.textarea-footer`, `.char-count`, `.char-count--warn` styles to `book-detail.component.scss`.
- **M5 — Friend action errors swallowed silently**: `profile-page.component.ts` — added `friendActionError: string | null` property, cleared at the start of every friend action, set with a user-readable message in each catch block. `profile-page.component.html` — added `@if (friendActionError)` error paragraph above the action buttons. `profile-page.component.scss` — added `.friend-action-error` (red text, light red background, rounded, padded).
- **M6 — Stats page errors swallowed silently**: `stats-page.component.ts` — added `errorGlobal` and `errorPace` string properties; `loadGlobalStats()` and `loadPace()` now set these on non-ok responses or network failures. `stats-page.component.html` — added `@else if (errorGlobal)` / `@else if (errorPace)` branches in all four stat card sections (top books, trending genres, top readers, reading pace). `stats-page.component.scss` — added `.error-msg` class (destructive color, centered, padded).

### Post-sprint UX Improvements (Batch 1)
- **U1 — Lazy loading gaps**: Added `loading="lazy"` to all remaining `<img>` tags across `book-detail.component.html`, `profile-page.component.html`, `continue-reading.component.ts`, `posts-feed.component.ts`, `post-comments.component.ts`, `top-nav.component.ts`, `recommended-books.component.ts`, `stats-page.component.html`. Auth and email-verification pages intentionally excluded (above-the-fold, eager loading is correct).
- **U2 — Profile join date**: Already correct — `joinDate` is mapped to a 4-digit year string and rendered as "Reading since YYYY". No change needed.
- **U3 — Book search pagination**: `book.service.ts` — `searchBooks()` now accepts `startIndex` and returns `{ books, totalItems }`. `book-search.component.ts` — added `startIndex`, `totalItems`, `isLoadingMore`, `hasMore` getter, and `loadMore()` method. `book-search.component.html` — added "Load more results" button below the grid (shown only when more results exist); result count shows "X of Y results". `book-search.component.scss` — added `.load-more-wrap`, `.load-more-btn`, `.btn-spinner` styles.
- **Stats top books clickable**: `stats-page.component.html` — top book rows now have `[routerLink]` when `googleBooksId` is available; `stats-page.component.scss` — added `.book-row--clickable` hover style. Backend `stats.service.ts` — added `google_books_id` to the top books query and response (`TopBook` interface updated).

### Post-sprint Community Page (Post-Day 15)
- **Community page added**: `/community` route with full social features
- **Frontend**: `CommunityPageComponent` (`src/app/features/community/community-page.component.ts`) — two-tab interface (All Posts / Trending), book picker for posts, tag filtering, trending tags sidebar
- **Backend**: `CommunityModule` in `backend/src/community/` with full REST API for post CRUD
- **Content moderation**: `CommunityService` uses Anthropic API to analyze post sentiment and moderate content (flagged/rejected/approved states)
- **Database**: Posts table with `tags` (string array), `sentiment` (positive/negative/neutral/mixed), soft-delete support
- **API endpoints**:
  - `GET /api/community/posts?tag=&page=&trending=` — paginated post feed with optional tag filter
  - `GET /api/community/tags/trending` — trending tags across all posts
  - `POST /api/community/posts` — create post with auto-tagging and moderation (max 2000 chars, up to 5 tags)

---

## Production deployment checklist

Before deploying to a production server:

1. **Set `FRONTEND_URL`** in `.env` / `backend/.env` to the actual production domain (e.g. `https://readtrack.example.com`) so CORS works correctly.
2. **Change `ports: "4200:80"` to `"80:80"`** (or `"443:443"`) in `docker-compose.yml` for production.
3. **Set up TLS** — put a reverse proxy (Caddy, Traefik, or nginx on the host) in front of port 80 to handle HTTPS.
4. **Supabase backups** — enable point-in-time recovery in the Supabase dashboard under Project Settings → Database.
5. **Run the Day 12 migration** if not already done (see Known Issues #7).
6. **Build and start**: `docker compose up --build -d`
7. **Verify health**: `curl http://localhost/api/health` should return `{"status":"ok"}`.

---

---

## Known issues / things to be aware of

1. **Home page hero section** — hidden when `books` table is empty (correct behavior,
   `*ngIf="heroBook"`). It will show once users add books to the catalog via search.

2. **LockManager warnings in console** — Supabase JS v2 cosmetic issue with concurrent
   auth requests. Not a real error, safe to ignore.

3. **`reading_statuses` IDs** — seeded in this order: 1=read, 2=want_to_read,
   3=currently_reading. The app resolves these dynamically by name, not by hardcoded int.

4. **Google Books API key** — stored in `.env` and `backend/.env` (both gitignored).
   Free tier is 1,000 req/day. When quota is hit, search falls back to the local `books`
   table (`ILIKE` on title) — no 502 error, just fewer results. Resets daily at midnight Pacific.

5. **Anthropic API key** — stored in `backend/.env` as `ANTHROPIC_API_KEY`. When missing or out of
   credits, recommendations fall back to 6 hardcoded mock books silently.

6. **user_books upsert** — uses `onConflict: 'user_id,book_id'`. The unique index
   `user_books_user_book_unique` must exist (created in Day 2 migration).

7. **Day 12 migration** — must be run manually in Supabase Dashboard SQL Editor if not already applied:
   ```sql
   ALTER TABLE public.user_books
     ADD COLUMN IF NOT EXISTS current_page INT,
     ADD COLUMN IF NOT EXISTS total_pages  INT,
     ADD COLUMN IF NOT EXISTS note         TEXT,
     ADD COLUMN IF NOT EXISTS review_text  TEXT;
   ```

8. **PostgREST join limitation** — `user_books.user_id` has no FK to `public.users`, so any
   feature needing user profiles from user_books must use the two-query pattern:
   fetch user_ids first → separate `.in('id', userIds)` on `users` table. See
   `StatsService.getTopReaders()` and `BookService.getCommunityReviews()` for reference.

---

## Git

- **Current branch:** `issabr`
- **Main branch:** `main`
- **Git user:** `Rihabb-A`

Commit to `issabr`, then merge to `main` when a day's work is complete.

---

## Style & conventions

- Angular: standalone components, no NgModules, `inject()` over constructor injection
- All new Angular components use `@if` / `@for` (Angular 17+ control flow), not `*ngIf` / `*ngFor`
  (the old home page still uses `*ngIf` — don't mix in new components)
- NestJS: module-per-feature, no class-validator (inline validation in controllers)
- SCSS: design tokens via CSS variables (`--primary`, `--foreground`, `--muted-foreground`, etc.)
- Color palette: warm cream/terracotta theme (`#F6EFE6` background, `#E9783F` primary orange)
- No comments in code unless the WHY is non-obvious
- No emojis in code or responses unless the user asks
