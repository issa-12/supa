# ReadTrack — Claude Code Handoff

## What this project is
ReadTrack is a social reading app (think Goodreads) built in a 15-day sprint.
Users can search books via Google Books, manage a personal shelf, follow friends,
post about books, and receive AI-powered reading recommendations.

**Current day: 9 of 15. Days 1–9 are fully complete.**

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
public.user_books     -- user shelf (user_id, book_id, status_id, rating)
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

---

## What is done (Days 1–9)

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

---

## What is left (Days 10–15)

### Day 10 — AI Recommendations (Claude API)
- NestJS endpoint: `GET /api/recommendations/:userId`
- Pull user's genres, rated books, reading history from Supabase
- Call Claude API (claude-haiku-4-5 for cost) with a structured prompt
- Cache results in a new `ai_recommendations` table (TTL 24h)
- Wire up the home page `RecommendedBooks` section with real AI results

### Day 11 — Stats dashboard
- Top books this week/month
- Top readers / trending genres
- User's reading pace chart

### Day 12 — Reading progress & notes
- Track current page / progress percentage on currently-reading books
- Private notes per book
- Public reviews (star rating + text)

### Day 13 — Search improvements
- Search users by name/username (already partially in UserService.searchUsers)
- Top nav search bar: show unified results for books AND users
- Filter/sort shelf by status, rating, date added

### Day 14 — Polish & performance
- Loading skeletons everywhere
- Error boundaries
- Image lazy loading already in place
- Offline detection

### Day 15 — Final deployment
- Production environment variables
- Custom domain if needed
- Final Docker build test
- Supabase backup

---

## Known issues / things to be aware of

1. **Home page hero section** — hidden when `books` table is empty (correct behavior,
   `*ngIf="heroBook"`). It will show once users add books to the catalog via search.

2. **LockManager warnings in console** — Supabase JS v2 cosmetic issue with concurrent
   auth requests. Not a real error, safe to ignore.

3. **`reading_statuses` IDs** — seeded in this order: 1=read, 2=want_to_read,
   3=currently_reading. The app resolves these dynamically by name, not by hardcoded int.

4. **Google Books API key** — stored in `.env` and `backend/.env` (both gitignored).
   The key posted in chat should be regenerated in Google Cloud Console and updated
   in both files.

5. **user_books upsert** — uses `onConflict: 'user_id,book_id'`. The unique index
   `user_books_user_book_unique` must exist (created in Day 2 migration).

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
