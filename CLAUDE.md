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
public.review_likes   -- like/dislike on community reviews (user_book_id, user_id, is_like) UNIQUE(user_book_id,user_id)
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
| GET | `/api/books/:googleId` | Book detail (DB first, then Google fallback); includes `ratingStats` (community star distribution) when the book is in the DB |
| POST | `/api/friends/request` | Send a friend request |
| PATCH | `/api/friends/:id/accept` | Accept an incoming request |
| PATCH | `/api/friends/:id/reject` | Reject an incoming request |
| DELETE | `/api/friends/:id` | Cancel sent request or remove friend |
| GET | `/api/friends` | List accepted friends (auth user) |
| GET | `/api/friends/requests` | List incoming pending requests |
| GET | `/api/friends/status/:userId` | Friendship status with a specific user |
| GET | `/api/recommendations/:userId` | AI book recommendations (Claude, 24h cache) |
| POST | `/api/recommendations/friend` | Recommend a book to a friend — admin-inserts it into the recipient's shelf as `recommended_by_friend` + notifies; returns `{ added: false }` if they already have it |
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
- **Content moderation**: `CommunityService.moderateAndAnalyze` uses the Anthropic API (`claude-haiku-4-5`) to classify each post `approved` / `flagged` / `rejected` + sentiment. **Policy (updated): both `rejected` (hate/harassment/explicit) and `flagged` (profanity / mildly inappropriate) are blocked at publish time (422), so only `approved` posts are stored.** The feed filter (`getAllPosts`/`getTrendingPosts`) also hides any pre-existing `flagged`/`rejected` rows: `or(moderation_status.is.null,and(...neq.rejected,...neq.flagged))` (legacy null-status posts stay visible). Note: moderation runs only at post time — Claude classifies profanity as `flagged`, not `rejected`, which is why blocking `flagged` (not just `rejected`) is required to stop bad-word posts. Every failure path (missing `ANTHROPIC_API_KEY`, API error, JSON parse error) falls back to `approved`/`neutral` so posting never hard-fails on an AI outage.
- **Database**: Posts table with `tags` (string array), `sentiment` (positive/negative/neutral/mixed), soft-delete support
- **API endpoints**:
  - `GET /api/community/posts?tag=&page=&trending=` — paginated post feed with optional tag filter
  - `GET /api/community/tags/trending` — trending tags across all posts
  - `POST /api/community/posts` — create post with auto-tagging and moderation (max 2000 chars, up to 5 tags)
  - `POST /api/community/comments` — create a comment/reply with the **same moderation** as posts (depth computed server-side, capped at 3; fires the comment notification)

### Post-sprint Moderation Everywhere (Post-Day 15)
- **Home-feed posts now moderated**: the home composer (`PostsFeedComponent.submitPost`) used `ActivityService.createPost` (a direct, **unmoderated** Supabase insert). It now calls `createCommunityPost` → `POST /api/community/posts`, so home-feed posts go through the same Claude moderation as the community page. Rejected/flagged posts surface an inline `postError`. (`ActivityService.createPost` is now unused.)
- **Comments now moderated**: comment creation moved from a client-side insert (`CommentService.addComment`) to `POST /api/community/comments` → `CommunityService.createComment`, which runs `moderateAndAnalyze` (blocks `flagged`/`rejected`, 422), computes depth from the parent server-side (cap 3), inserts via the admin client, and fires the comment notification from the backend. `CommentService` lost its client-side notification firing + `NotificationsService` dependency. `PostCommentsComponent` shows an inline `commentError` on rejection.
- **Caveat — comment notifications need a migration**: `notifications_type` was found to be **missing `post_commented` / `comment_replied`** on the live DB — migration `20260524000002_comment_notification_types.sql` was never applied, so comment notifications have never fired. Comment creation tolerates this (the notify call is best-effort/caught), but **apply `20260524000002` to enable comment notifications.**
- **Tradeoff**: moderation adds a synchronous Claude call (~2–5s) to each post *and now each comment*. Kept synchronous on purpose (demonstrable "moderate before publish"); commenting is now correspondingly slower.

### Post-sprint Notifications & i18n Hardening (Post-Day 15)
- **NG0203 crash fix**: `app.ts` and `top-nav.component.ts` called `takeUntilDestroyed()` inside `ngOnInit` (outside the injection context), which threw `NG0203` and aborted nav init — so the notification bell/panel never loaded. Fixed by injecting `DestroyRef` and passing it: `takeUntilDestroyed(this.destroyRef)`. All other `takeUntilDestroyed()` calls are in constructors (valid) and were left alone.
- **Notification panel resilience** (`notifications.service.ts`, `notifications-panel.component.ts`, `top-nav.component.ts`):
  - `markAsRead` / `markAllAsRead` are now optimistic with rollback and never reject (template click handlers fire-and-forget safely).
  - `loadNotifications` returns a success boolean and pulls the exact unread count from `/unread-count` in parallel (the list endpoint is capped at 20, so deriving the badge from it under-reported). A failed load now shows a distinct **"Couldn't load notifications" + Retry** state instead of masquerading as the empty state.
  - Realtime INSERT handler reconciles the badge via `loadUnreadCount()` (exact) instead of a blind optimistic `+1`, so the bell can never show a phantom count.
  - Panel: avatar `(error)` fallback to initials; relative timestamps refresh once a minute via `ChangeDetectorRef.markForCheck()`.
- **Notification labels translated**: removed the hardcoded English `NOTIFICATION_LABELS` map; the panel resolves labels from the typed `NOTIFICATIONS_COPY` i18n object (EN/AR/FR).
- **`timeAgo(iso, lang)`**: now takes a `LanguageCode` and returns localized relative-time strings; all call sites (posts-feed, post-comments, community-page, profile-page, notifications-panel) pass `lang`.
- **Shelf section titles translated**: the library section headings ("Currently Reading" / "Want to Read" / "Already Read") used a hardcoded English map; replaced with a reactive `sectionLabel(statusName)` method reading from `SHELF_COPY`, so they translate and update live on language switch.
- **RTL dropdown clipping fix**: the notifications panel and nav user-menu were pinned with physical `right: 0`, so in Arabic (`dir="rtl"`) they overflowed off-screen. Switched to logical `inset-inline-end`, which flips with direction. (No `[dir="rtl"]`/`:host-context` CSS exists elsewhere — the app relies on `dir` on `<html>` set in `app.ts`.)

### Post-sprint Friend Request Revival (Post-Day 15)
- **Bug**: the profile page showed "Add friend" for both `none` and `rejected` statuses, but the backend `sendRequest` only did an `INSERT` — so re-requesting someone whose prior request was rejected hit the `friendship_unique_pair` unique index and returned **409**, with "Please try again" that could never succeed.
- **Fix** (`backend/src/friends/friends.service.ts`): `sendRequest` now looks up the existing row first — `rejected` → revives it to `pending` with the current user as requester (and fires the `friend_request` notification); `blocked` → 403 with an unblock message; `pending`/`accepted` → 409; no row → insert (keeps the `23505` race guard).
- **Frontend** (`profile-page.component.ts`): `sendFriendRequest` surfaces the server's actual message instead of generic retry text, and a new `refreshFriendshipStatus()` re-syncs the button state on failure.

### Post-sprint Book Page: Rating Breakdown, Status Dropdown, Review Reactions (Post-Day 15)
- **Community rating distribution**: `GET /api/books/:googleId` now returns `ratingStats { average, total, distribution[] }` (5★→1★ with count + percent), aggregated from `user_books.rating` via the **admin client** (`BooksService.getRatingStats`) — a client-side query couldn't see all ratings because `user_books` RLS is `user_id = auth.uid() OR is_public = true`. Rendered at the top of the book page (average + stars + percentage bars); hidden when there are zero ratings. `null` for books not yet in the catalog. **Requires the backend to be restarted** to serve the new field.
- **Status control merged**: the book page previously showed a separate "Currently Reading" badge **and** a "Change status" button. Now a single `.shelf-status-btn` (green check + status label + caret) is the dropdown trigger.
- **Review like/dislike** (`review_likes` table — see migration `20260602000000_review_likes.sql`):
  - A "review" is a `user_books` row with `review_text`; reactions key off its `user_book_id`. One row per (review, user) with an `is_like` boolean; clicking the active reaction clears it, switching flips it.
  - `LikesService.toggleReviewReaction()` (upsert/delete; fires `review_liked` notification on a new like). `BookService.getCommunityReviews` batch-fetches reactions and returns `likeCount`, `dislikeCount`, `myReaction`, `userBookId` on each `CommunityReview`.
  - `book-detail` has optimistic Helpful/Not-helpful buttons (EN/AR/FR labels). Degrades gracefully if the table is missing (counts show 0, no crash).

### Post-sprint Online Presence (Post-Day 15)
- **What/why**: adds online/offline status for users, completing the last gap in the **Standard User Management** major module ("add friends and see their online status").
- **Heartbeat approach** (`src/app/core/services/presence.service.ts`): a `last_seen_at TIMESTAMPTZ` column on `public.users` (migration `20260606000000_user_last_seen.sql`). `PresenceService.startHeartbeat()` writes `last_seen_at = now()` immediately on login and then every **2 minutes** via `setInterval`; a user is considered **online if seen within the last 5 minutes**. The interval runs inside `NgZone.runOutsideAngular` (it's a background DB write — no change detection, and it must not keep the app perpetually "unstable", which would break the PWA service-worker registration).
- **App-wide init**: `App.ngOnInit` (`app.ts`) calls `presenceService.init()` once; it starts/stops the heartbeat on `supabase.auth.onAuthStateChange` (deferred via `setTimeout` to avoid the auth LockManager deadlock). `loadPresenceForUser(id)` checks a given user's `last_seen_at` on demand and updates `onlineUserIds$: BehaviorSubject<Set<string>>` (via `NgZone.run` so dots update); the profile page calls it for each friend / the viewed user on load.
- **UI** (profile page): green dot on each friend's avatar in the friends grid (`presence-dot--avatar`), a green dot on the viewed user's profile avatar, and an Online/Offline text label under their name. Dots use logical `inset-inline-end` so they flip in RTL.
- **i18n**: `onlineLabel` / `offlineLabel` added to `PROFILE_COPY` (EN/AR/FR).
- **Note**: a user shows online for up to ~5 min after closing the tab (the heartbeat just stops; `last_seen_at` isn't cleared). Presence is checked on profile load, not live-polled. **Requires the `user_last_seen` migration to be applied.**

### Post-sprint Avatar Sync (Post-Day 15)
- **`UserService.currentUserAvatar$`** (`BehaviorSubject<string|null>`): the top-nav subscribes to it for the nav avatar; the profile page calls `setCurrentUserAvatar(url)` after an avatar upload so the nav updates immediately without a reload. The top-nav avatar fallback uses a `ui-avatars.com` URL built from the user's initial (`avatarFallback` getter).

### Post-sprint HTTPS (Post-Day 15)
- **TLS termination at nginx**: the frontend nginx now serves the whole app (SPA + `/api/` proxy) over **HTTPS on 443**, satisfying the mandatory "HTTPS everywhere" requirement. The backend stays unexposed on the internal Docker network, so the only public surface is the TLS-terminated proxy.
- **Cert provisioning at startup** (`docker/ensure-certs.sh`, run via nginx's `/docker-entrypoint.d` hook): if `certs/selfsigned.{crt,key}` is mounted (compose mounts `./certs` → `/certs:ro`) it is used; otherwise a self-signed fallback is generated. So `docker compose up` always works, and dropping in a **locally-trusted mkcert** pair gives a warning-free HTTPS + working PWA. **Self-signed → Chrome shows a trust warning AND refuses to register the service worker** ("An SSL certificate error occurred when fetching the script", surfaced as Angular **NG05604**), so for a clean console + installable PWA the cert must be trusted (mkcert — see `certs/README.md`). `certs/*.crt|key` are gitignored.
- **nginx.conf**: split into two server blocks — `:80` 301-redirects everything to HTTPS (except a plain-HTTP `/healthz` used by the Docker healthcheck so it needs no cert), and `:443 ssl http2` serves the app with TLSv1.2/1.3, HSTS (`max-age=31536000; includeSubDomains`), and the existing CSP/security headers. Because nginx drops inherited `add_header`s in any location that sets its own, the security headers + HSTS + CSP are **repeated in `location = /index.html`** so they reach the document response and every SPA route (try_files rewrites to it).
- **docker-compose.yml**: frontend now publishes `80:80` and `443:443` (was `4200:80`); healthcheck hits `http://localhost/healthz`.
- **App URL is now `https://localhost`** (was `http://localhost:4200`). `.env.example` `FRONTEND_URL` updated to `https://localhost`. No mixed-content risk — there are no hardcoded `http://` URLs in `src/`; the SPA calls `/api/` same-origin and Supabase over https/wss.
- **CSP correction**: the existing CSP had never actually been enforced (nginx dropped it on the document via the `add_header` inheritance behavior above), so it had drifted out of sync with `index.html`. Once enforced it blocked the top-nav icons + the PT Serif font. Widened `script-src` to allow `cdn.jsdelivr.net` (iconify-icon component), `style-src` → `fonts.googleapis.com`, `font-src` → `fonts.gstatic.com`, and `connect-src` → all three iconify API hosts (`api.iconify.design`, `api.simplesvg.com`, `api.unisvg.com`). **If you add any new external CDN/script/font, update the CSP in BOTH places in `nginx.conf` (server block + `location = /index.html`).**

### Post-sprint PWA (Post-Day 15)
- **What/why**: installable Progressive Web App with offline support — the Web *minor* module (+1). Builds on the HTTPS work (service workers require a secure context).
- **Wiring** (Angular service worker): `@angular/service-worker@19.2.21` (pinned to match `@angular/core` 19.2.21), `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerImmediately' })` in `app.config.ts`, `ngsw-config.json` (prefetch app shell + lazy assets), and `"serviceWorker": "ngsw-config.json"` under the production build config in `angular.json`. **SW is enabled in production builds only** (disabled under `ng serve` / `npm start` by `isDevMode()`), so test the PWA via Docker, not the dev server.
- **`registerImmediately` (not `registerWhenStable`)**: the app has long-lived timers (presence heartbeat, notification timestamp refresh) so it never reaches Angular "stable" — `registerWhenStable` would stall 30s and log **NG0506**. Relatedly, the presence heartbeat `setInterval` runs via `NgZone.runOutsideAngular` so it doesn't keep the app unstable or trigger needless change detection.
- **Trusted cert required**: a self-signed cert makes Chrome refuse SW registration (NG05604). The PWA only registers cleanly over a **trusted** cert — see the HTTPS section / `certs/README.md` (mkcert).
- **External images removed**: the auth / email-verification / reset-password pages used an `images.unsplash.com` background `<img>` that was fully hidden behind an opaque overlay anyway — removed (it was throwing `ERR_CERT_AUTHORITY_INVALID` and is an unnecessary external dependency).
- **Manifest** (`public/manifest.webmanifest`): name "ReadTrack", `theme_color #E9783F`, `background_color #F6EFE6`, `display: standalone`, 8 icon sizes (72–512, `purpose: "maskable any"`). `theme-color` meta added to `index.html`.
- **Icons**: branded terracotta open-book tiles generated by `scripts/gen-pwa-icons.js` (uses `pngjs`, 4× supersampled). pngjs is **not** a project dependency — install it ad hoc only if regenerating icons.
- **nginx**: `ngsw-worker.js` / `ngsw.json` / `safety-worker.js` / `worker-basic.min.js` are served **no-cache** (fixed un-hashed names — caching them immutable would freeze updates); this block is placed **before** the generic `.js` immutable-cache rule (first matching regex wins). `manifest.webmanifest` is no-cache with `application/manifest+json` MIME.
- **Offline**: `ngsw.json` prefetches the app shell (index.html, JS, CSS, manifest) so the app loads offline after first visit; `/api/` and Supabase calls are runtime (not cached) and degrade when offline (the existing offline banner covers UX).
- **Install/test**: `docker compose up --build` → `https://localhost` → Chrome shows an install icon in the address bar; reload offline to confirm the shell loads.

### Post-sprint Timestamp UTC fix (Post-Day 15)
- **`timeAgo()`** (`src/app/core/util/time-ago.ts`): Postgres `timestamp without time zone` columns come back from PostgREST with **no zone designator**, so `new Date()` parsed them in the browser's local zone — a freshly-created row read as "3h ago" for a UTC+3 user. `normalizeTimestamp()` now appends `Z` (treats as UTC) when no zone is present; values that already carry a zone (timestamptz) are untouched. Fixes relative times app-wide (notifications, posts, comments, profile).

### Post-sprint Mobile / Responsive pass (Post-Day 15)
- **Root cause pattern**: a CSS `1fr` grid track is `minmax(auto, 1fr)`, and the `auto` minimum equals the **content's min-width** (e.g. a cover's natural image width, a carousel's full row), so the column grew past the viewport → sideways scroll, clipped content, "1.5 cards per row", giant covers. Fixed by using **`minmax(0, 1fr)`** (or `repeat(2, minmax(0,1fr))` on phones) on every collapsing grid: home (`home-bottom-grid`), community (`community-layout`), stats (`stats-grid`), and the book grids (shelf/profile/book-search ≤480). Plus `min-width: 0` on flex text containers (hero content, post-meta, reader-name, profile-header-info, community-main, stat-card, pace bars) so long text wraps instead of overflowing, and `overflow-wrap: break-word` on user text (bios, posts, comments, reviews, titles).
- **Global guard** (`styles.scss`): `html, body { overflow-x: clip; max-width: 100% }` — `clip` (not `hidden`) so it doesn't create a scroll container that would break the sticky navs. Plus `img { max-width: 100% }`.
- **Top nav** (`top-nav.component.ts`): `position: sticky`; on phones the search wraps to its own full-width row, the word-mark hides, and icons shrink, so the action bar fits at 375px.
- **Book covers** — robust pattern: the **wrapper** (`.cover-wrap` / `.book-cover-container`) owns a fixed `aspect-ratio: 2 / 3` box at `width: 100%`, and the image just fills it (`width/height: 100%; object-fit: cover`). Previously each *image* carried the aspect-ratio, so a high-res cover or a stretched cell could blow it up. Applied to shelf, profile, book-search, and book-detail.
- **Hero** (`hero-section.component.ts`): `min-width: 0` + `overflow-wrap` so the title/labels wrap; eyebrow + labels stack on mobile.
- **Notifications panel**: on phones it's a `position: fixed` sheet (escapes `.app-viewport { overflow: hidden }` clipping) below the nav, with its list scrolling inside.

### Post-sprint Dynamic Hero Genre (Post-Day 15)
- The home hero eyebrow ("Because you like …") was a hardcoded "Mystery". Now it uses the **hero book's own genre**, falling back to the user's top onboarding genre, then a generic label.
- **Backend** (`recommendations.service.ts`): Claude returns a `genre` per recommended book (added to the prompt, `ClaudeSuggestion`/`RecommendationBook` interfaces, mock fallback, and all return paths). **Existing cached `ai_recommendations` rows predate the field** — they fall back to the favorite genre until the 24h cache refreshes (or the row is deleted).
- **Frontend**: `genre` flows through `BookService.getRecommendedBooks` → `mapBook` → `HeroSectionComponent`; `heroEyebrowPrefix` added to `HOME_COPY` (EN/AR/FR), genre name itself comes from the data.

### Post-sprint Performance Pass (Post-Day 15)
Latency/throughput audit + fixes. All changes verified: frontend `ng build` (prod) + backend `nest build` pass; the three stats RPCs were run against live Supabase; `nginx -t` passes. Pages audited page-by-page — no regressions.

- **Lazy-load Home + Profile routes** (`app.routes.ts`): `HomePageComponent` and `ProfilePageComponent` were the only protected routes still statically imported (eagerly bundled into the initial chunk). Switched to `loadComponent`. The prod build now emits `home-page-component` (~54 kB) and `profile-page-component` (~77 kB) as separate lazy chunks, shrinking the initial download. (They're referenced nowhere else, so code-splitting is clean.)
- **Cache `reading_statuses` IDs** (`book.service.ts`): added a memoized `resolveStatusId(name)` backed by a single `statusMapPromise` (name→id `Map`). Replaced the per-call `reading_statuses` lookup in `getContinueReadingBooks`, `getUserBooksByStatus`, `addToCurrentlyReading`, `addBookToReadingList` — removes one Supabase round-trip per shelf/book op. On fetch error the promise is reset so the next call retries (no cached failure). **Note:** `book-search.component.ts`, `book-detail.component.ts`, `shelf.component.ts`, and `user.service.getUserReadingStats` still do their own inline `reading_statuses` lookups — a future consistency cleanup, not a bug (static seed table, no staleness).
- **Cache `friendship_status` ID** (`activity.service.ts`): memoized `resolveAcceptedStatusId()` (same reset-on-error pattern) — removes the extra round-trip on every home-feed load.
- **Batch presence queries** (`presence.service.ts` + `profile-page.component.ts`): new `loadPresenceForUsers(ids)` resolves a whole friends list in one `.in('id', ids)` query. The profile page previously fired one query per friend in a `forEach` loop (N queries → 1). The single-user `loadPresenceForUser` is retained for the viewed-user path.
- **Stats DB-side aggregation** (`backend/src/stats/stats.service.ts` + migration `20260616000001_stats_rpc.sql`): `getTopBooks` / `getTrendingGenres` / `getTopReaders` previously downloaded **every** matching `user_books` / `user_genres` row and counted in JS (full-table transfer that degrades at scale). Now they call Postgres functions `stats_top_books(since)`, `stats_trending_genres()`, `stats_top_readers(read_status_id)` that GROUP BY + aggregate server-side and return only the small result set. `stats_trending_genres` uses `SUM(cnt) OVER ()` so the percentage denominator is the platform-wide total, not just the top 6. `stats_top_readers` joins `user_books → users` in one pass (replacing the old two-query + JS pattern). **The pre-RPC JS implementations are retained as `*Fallback` methods** that trigger (with a logged warning) if the RPC errors — so an environment without the migration still works. `getReadingPace` was left on its direct query (per-user, small, now index-backed). Controller response contract (`{ topBooks, trendingGenres, topReaders }`) is unchanged.
- **DB indexes** (migration `20260616000000_performance_indexes.sql`): composite `idx_user_books_user_status (user_id, status_id)` for shelf lookups; `idx_user_books_updated_at` for stats period range scans; partial `idx_users_last_seen (last_seen_at) WHERE last_seen_at IS NOT NULL` for presence checks.
- **nginx backend keepalive** (`nginx.conf`): added `upstream backend { server backend:3000; keepalive 32; }` and pointed `proxy_pass` at it (with the existing `proxy_http_version 1.1` + `Connection ""`), so `/api/` reuses TCP connections to NestJS instead of opening a fresh one per request.
- **Two new migrations must be applied** in the Supabase SQL editor: `20260616000000_performance_indexes.sql` and `20260616000001_stats_rpc.sql`. Until the RPC migration is applied, stats transparently fall back to the old JS path. **Restart the backend** after applying the RPC migration.
- **Deliberately deferred** (not done): making community post moderation async/fire-and-forget (kept synchronous — the "moderate before publish" behavior is a graded, demonstrable AI module); `ChangeDetectionStrategy.OnPush` (broad, needs its own pass); trending-feed like-count sort pushed to the DB; the shared feed like/comment-count aggregation across `activity.service` + `community.service` (5 call sites, hot path — wants a dedicated change with verification).

### Post-sprint Friend Book Recommendations (Post-Day 15)
- **What/why**: when a friend recommends a book it's auto-added to the recipient's shelf as a pending **"Friends Recommendations"** inbox, where they **Accept** (→ moves to Want to Read) or **Decline** (→ row deleted). Fills the gap the schema anticipated — the `recommended_by_friend` reading status was seeded on day 1 but unused. Verified: backend `nest build` + frontend prod `ng build` pass; live check confirmed the `recommended_by_friend` seed (status_id **5** in this DB — resolved by name, never hardcoded) and the new column applied.
- **Migration** `20260616000002_friend_recommendations.sql`: adds `recommended_by uuid` (FK → `users`, `ON DELETE SET NULL`) to `user_books` — records who recommended it (so the shelf card shows "Recommended by <name>"). No RLS change: the cross-user insert uses the backend admin client (user_books INSERT RLS only allows writing your own row); accept (UPDATE status) / decline (DELETE) act on the recipient's own row, already covered by existing policies.
- **Backend** `POST /api/recommendations/friend` (`recommendations.controller`/`service`, now imports `NotificationsModule`): inserts the book into the recipient's shelf as `recommended_by_friend` + fires the `book_recommended` notification. **Generic "already has it" handling** — if the recipient already has the book in *any* status, it does nothing and returns `{ added: false }` (no clobber of their status/progress, no duplicate, no notification, no leak of which status). Status id resolved by name + cached; race-safe on the unique index (`23505` → treated as already-present).
- **Frontend**:
  - `recommendation.service.recommendBook` now ensures the book in the catalog (client) then calls the endpoint; returns `{ added }`.
  - `book.service`: `recommendedBy`/`recommendedByName` on `UserBook` (shelf query batch-fetches recommender names — two-query pattern, no FK to users); `acceptFriendRecommendation` (→ want_to_read, keeps `recommended_by` for attribution), `declineFriendRecommendation` (delete), `findPendingRecommendationUserBookId` (used by the bell panel, which only knows the book_id).
  - **Shelf**: "Friends Recommendations" section pinned at top (`STATUS_ORDER` -1), a filter pill shown only when recs exist, per-card "Recommended by X" + Accept/Decline. Resets the filter to "All" after acting on the last rec (avoids a stuck empty filter).
  - **Notification panel**: Accept/Decline buttons on `book_recommended` notifications (idempotent — if already actioned from the shelf, the lookup returns null and the buttons just clear).
  - **Book detail**: recommender sees "Already on their shelf" when the friend already has it.
  - i18n: new EN/AR/FR strings in `shelf`, `notifications`, `bookDetail`.
- **Audit fix — Top Books**: friend recommendations auto-insert a `user_books` row the recipient didn't choose, which would have inflated the **Top Books** stat. Migration `20260616000003_stats_top_books_exclude_recs.sql` re-defines `stats_top_books` to exclude the `recommended_by_friend` status; the JS fallback in `stats.service` filters it too. (Once accepted → want_to_read, the book counts normally; declined → row gone.) Other stats are unaffected (top readers count only `read`; genres are independent).
- **Requires applying** migrations `20260616000002` and `20260616000003` (the recipient column was applied during testing; **`20260616000003` still needs running** for the Top Books exclusion to take effect) and **restarting the backend**.
- **Follow-up — notification panel polish**:
  - **Stale Accept/Decline fix**: the bell-panel buttons used to linger after a rec was resolved elsewhere (shelf accept/decline, or a status change on the book page). They're now gated on `BookService.getPendingRecommendationBookIds()` (one query fetched when the panel opens) — buttons show only while the book is still in `recommended_by_friend` status. In-panel actions still hide instantly via `handledRecIds`.
  - **Dismiss (X) button**: every notification now has an X to delete it. `DELETE /api/notifications/:id` (admin client, ownership-checked) + `NotificationsService.deleteNotification` (optimistic remove + badge decrement, rollback on failure). `dismissAriaLabel` added to `NOTIFICATIONS_COPY` (EN/AR/FR).

---

## Production deployment checklist

Before deploying to a production server:

1. **Set `FRONTEND_URL`** in `.env` / `backend/.env` to the actual production domain (e.g. `https://readtrack.example.com`) so CORS works correctly.
2. **TLS is built in** — nginx serves HTTPS on port 443 and 301-redirects HTTP→HTTPS. The image bakes a **self-signed** cert (`/etc/nginx/certs/`), so browsers show a trust warning on first visit. For production, mount a CA-issued cert/key over `/etc/nginx/certs/selfsigned.crt` and `selfsigned.key` (e.g. via a volume), or terminate TLS at an upstream proxy (Caddy/Traefik) and point it at port 80.
3. **Supabase backups** — enable point-in-time recovery in the Supabase dashboard under Project Settings → Database.
4. **Run outstanding migrations** if not already done: the Day 12 `user_books` columns (see Known Issues #7), the post-sprint performance migrations `20260616000000_performance_indexes.sql` + `20260616000001_stats_rpc.sql` (see the Performance Pass section), and the friend-recommendation migrations `20260616000002_friend_recommendations.sql` + `20260616000003_stats_top_books_exclude_recs.sql` (see the Friend Book Recommendations section).
5. **Build and start**: `docker compose up --build -d`
6. **Verify health**: `curl -k https://localhost/api/health` should return `{"status":"ok"}` (`-k` skips the self-signed cert check).

---

---

## Known issues / things to be aware of

1. **Home page hero section** — hidden when `books` table is empty (correct behavior,
   `*ngIf="heroBook"`). It will show once users add books to the catalog via search.

2. **LockManager warnings in console** — Supabase JS v2 used the browser Navigator
   LockManager for auth-token access, which logged "Acquiring an exclusive Navigator
   LockManager lock … immediately failed" on concurrent `getUser`/`getSession` calls.
   **Fixed**: `supabase.service.ts` passes `auth.lock: inMemoryAuthLock` (a promise-chain
   in-memory lock) to `createClient`, so the Navigator LockManager is never used.

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

8. **`review_likes` migration** — `supabase/migrations/20260602000000_review_likes.sql` must be
   run in the Supabase SQL Editor for review like/dislike to persist. **Applied and verified live**
   (table + RLS + `UNIQUE(user_book_id, user_id)` confirmed). Until applied, reviews still render
   but reactions show 0 and don't save (no crash).

9. **PostgREST join limitation** — `user_books.user_id` has no FK to `public.users`, so any
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
