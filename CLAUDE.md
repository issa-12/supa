# ReadTrack — Claude Code Handoff

## What this project is
ReadTrack is a social reading app (think Goodreads) built in a 15-day sprint.
Users can search books via Google Books, manage a personal shelf, follow friends,
post about books, and receive AI-powered reading recommendations.

**Current day: 4 of 15. Days 1–3 are fully complete.**

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

---

## What is done (Days 1–3)

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

---

## What is left (Days 4–15)

### Day 4 — Friends system (START HERE)
- Friend request: send, accept, reject, cancel
- Friend list page or section
- Supabase tables: `friendship` + `friendship_status` already exist
- NestJS endpoints needed: POST /api/friends/request, PATCH /api/friends/:id/accept, etc.
- Angular: friend request button on profile pages, friends list on profile

### Day 5 — Notifications
- Real-time notifications via Supabase Realtime (channel subscription)
- Triggered on: friend request, friend accepted, book recommended, post liked
- `notifications` + `notifications_type` tables already exist
- Bell icon in top nav (already has badge dot, needs real count)

### Day 6 — Community posts
- Create a post about a book (text + book reference)
- Home feed showing friends' posts
- `posts` table already exists

### Day 7 — Comments & likes
- Comment threads on posts (depth 0–3, `parent_comment_id` column exists)
- Like posts and comments
- `comments`, `post_likes`, `comment_likes` tables already exist

### Day 8 — Community completion
- Post tags
- Trending posts
- Book recommendations between friends (recommend a specific book to a friend)

### Day 9 — Profile enhancements
- Real reading stats (books read this year vs goal)
- Reading goal setting
- User's recent activity feed on profile
- Favourite books / reading history sections

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
