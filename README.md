_This project has been created as part of the 42 curriculum by `issabr`, `ratwi`, `skreik`._

# ReadTrack

A social reading platform — track the books you read, follow friends and see their online status, post about books in a moderated community feed, and get AI-powered, personalized recommendations.

This is our team's take on the **ft_transcendence** "build your own web app" project: a Goodreads-style social reading network.

---

## Description

**ReadTrack** lets readers:

- **Authenticate securely** — email + one-time-code sign-up, Google OAuth, and optional two-factor authentication (2FA).
- **Discover books** via the Google Books catalogue and build a personal **shelf** (Want to read / Currently reading / Read), with reading progress, private notes, ratings, and public reviews.
- **Connect** — add friends, see their **online/offline status**, and view their profiles and reading activity.
- **Engage in a community feed** — post about books, comment, like, and tag, with **AI content moderation and sentiment analysis** on every post.
- **Get AI recommendations** — a Claude-powered engine suggests books based on the user's genres, ratings and history.
- **See stats** — a personal/global analytics dashboard (top books, trending genres, top readers, reading pace).
- Use the app in **English, Arabic (RTL) and French**, install it as a **PWA**, and run it over **HTTPS**.

The whole app supports **multiple concurrent users** with real-time notifications.

---

## Features list

| Feature | Description |
|---|---|
| Authentication | Email OTP sign-up, login, Google OAuth, email verification, password reset |
| Two-Factor Auth (2FA) | Optional 2FA toggle in profile |
| Genre onboarding | First-run genre picker; gates the app via a route guard |
| Book search & catalogue | Google Books proxy search with pagination; shared `books` catalogue |
| Personal shelf | Status columns, reading progress bar, ratings, private notes, public reviews; filter & sort |
| Book detail | Star rating, shelf status, community rating breakdown, reviews + helpful/not-helpful reactions, recommend-to-friend |
| Friends system | Send/accept/reject/cancel requests, friends list, block/report, friendship status |
| Online presence | Heartbeat-based online/offline status shown on friends & profiles |
| Real-time notifications | Live bell + dropdown (friend requests, likes, comments, recommendations) via Supabase Realtime |
| Community feed | Create posts (with book + tags), threaded comments, likes, trending tab, tag filtering |
| AI content moderation | Posts **and comments** analysed and moderated via Claude (profanity/abuse blocked before publish) |
| AI sentiment analysis | Each post tagged positive / negative / neutral / mixed |
| AI recommendations | Personalized book suggestions (Claude), enriched with Google Books, cached 24h; powers the home hero + grid |
| Stats dashboard | Top books, trending genres, top readers, personal monthly reading pace |
| Profiles | Avatar upload (add / change / remove), bio, username, reading goal, currently reading, recent posts |
| Private accounts | Make a profile private — shelf/stats/posts/comments visible to friends only; still findable in search (shows a locked state) |
| i18n + RTL | English / Arabic (RTL) / French with a live language switcher |
| PWA | Installable, offline app shell via service worker |
| HTTPS | nginx TLS termination + HTTP→HTTPS redirect |
| Responsive design | Mobile-first layouts down to 375px (iPhone SE) |
| Privacy Policy / Terms | Dedicated, footer-linked legal pages |

---

## Modules

Total: **19 points** (4 Major × 2 = 8, 11 Minor × 1 = 11).

### Web
| Module | Type | Pts | How it's implemented |
|---|---|---|---|
| Framework — frontend **and** backend | Major | 2 | **Angular 19** SPA (standalone components) + **NestJS 10** REST backend |
| Real-time features | Major | 2 | **Supabase Realtime** (`postgres_changes`) drives the live notification bell across clients |
| Notification system | Minor | 1 | Notifications fired on friend requests, likes, comments, recommendations; live unread badge |
| Advanced search | Minor | 1 | Book search with debounce, **filters, sorting and pagination**; unified top-nav search |
| Progressive Web App | Minor | 1 | `@angular/service-worker` + manifest + icons; installable, offline app shell |

### Accessibility & Internationalization
| Module | Type | Pts | How it's implemented |
|---|---|---|---|
| Multiple languages (≥3) | Minor | 1 | Full **EN / AR / FR** translations + in-app language switcher |
| Right-to-left (RTL) | Minor | 1 | Arabic RTL with logical-property layout mirroring; live LTR↔RTL switching |

### User Management
| Module | Type | Pts | How it's implemented |
|---|---|---|---|
| Standard user management | Major | 2 | Profile edit, **avatar upload** (Supabase Storage, default avatar), **friends + online status**, profile pages |
| OAuth 2.0 | Minor | 1 | **Google** sign-in via Supabase Auth |
| Two-Factor Authentication | Minor | 1 | Complete 2FA enable/disable flow |
| Online presence | Minor | 1 | Heartbeat `last_seen_at`; online/offline status shown on friends & profiles |
| User activity analytics dashboard | Minor | 1 | `/stats` — personal reading pace + global insights |

### Artificial Intelligence
| Module | Type | Pts | How it's implemented |
|---|---|---|---|
| Recommendation system | Major | 2 | **Claude** builds personalized suggestions from the user's genres/ratings/history; content-based, enriched with Google Books, cached 24h |
| Content moderation AI | Minor | 1 | Community posts auto-moderated (approve / flag / reject) by Claude |
| Sentiment analysis | Minor | 1 | Each post classified positive / negative / neutral / mixed |

> **Note for the defense:** the team should be ready to demonstrate each module live (per the subject, non-functional modules score 0). The Real-time and Recommendation majors are implemented with Supabase Realtime and the Claude API respectively — be prepared to explain both.

---

## Technical stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Angular 19 (standalone components, no SSR), SCSS, RxJS | Mature framework with routing, DI, and a strong component model |
| **Backend** | NestJS 10 (Node 20), global `api` prefix | Structured, modular Node framework (module-per-feature) with first-class TypeScript |
| **Database / Auth / Storage** | Supabase (PostgreSQL + Auth + Storage + Realtime) | One managed platform for relational data, auth (OTP/OAuth/2FA), file storage (avatars), and websockets — with Row-Level Security |
| **AI** | Anthropic Claude API (`claude-haiku-4-5`) | Recommendations, content moderation, and sentiment analysis |
| **External data** | Google Books API | Book metadata, covers, and search |
| **Styling** | SCSS with CSS-variable design tokens (warm cream/terracotta theme) | Lightweight, framework-agnostic, themeable |
| **Deployment** | Docker Compose — nginx (frontend + TLS + `/api` proxy) + NestJS container | Single-command, reproducible; TLS terminates at nginx, backend stays on an internal network |

Other notable libraries: `@supabase/supabase-js`, `@anthropic-ai/sdk`, `iconify-icon` (icons), `@angular/service-worker` (PWA).

> **Note:** the project uses the Supabase client SDK rather than a standalone ORM.

---

## Database schema

PostgreSQL (Supabase). All tables have **Row-Level Security** enabled.

Core tables and relationships:

- **`users`** — mirrors `auth.users` (`id = auth.uid()`); `name`, `profile_picture_url`, `bio`, `username`, `last_seen_at`, `is_private`.
- **`profiles`** — extended profile data.
- **`books`** — shared catalogue; `google_books_id` UNIQUE, `title`, `author_name`, `description`, `cover_image_url`.
- **`user_books`** — a user's shelf entry: → `users`, → `books`, → `reading_statuses`; `rating`, `note`, `review_text`, `current_page`, `total_pages`, `recommended_by`. UNIQUE `(user_id, book_id)`.
- **`reading_statuses`** — reference: read / want_to_read / currently_reading / recommended_by_friend.
- **`reading_goals`** — annual goal per user; UNIQUE `(user_id, year)`.
- **`genres`** (20 seeded) ↔ **`user_genres`** (many-to-many user↔genre).
- **`posts`** — community posts → `users`, optional → `books`; `tags[]`, `sentiment`, soft-delete.
- **`comments`** — threaded (`parent_comment_id`, depth 0–3) → `posts`.
- **`post_likes`**, **`comment_likes`**, **`review_likes`** (`UNIQUE(user_book_id, user_id)`).
- **`friendship`** — `user_id1`, `user_id2`, `requester_id`, → `friendship_status` (pending/accepted/rejected/blocked); order-independent unique pair.
- **`notifications`** → `users` (recipient + actor), → `notifications_type`.
- **`ai_recommendations`** — cached Claude recommendations per user (JSONB, 24h TTL).
---

## Instructions

### Prerequisites
- **Docker** + **Docker Compose** (recommended), or **Node.js 20** for local dev.
- A **Supabase** project, a **Google Books API** key, and an **Anthropic (Claude) API** key.
- *(Optional, for warning-free HTTPS + PWA)* **[mkcert](https://github.com/FiloSottile/mkcert)**.

### 1. Environment variables
Copy `.env.example` to `.env` (root, used by Docker) and `backend/.env` (used by local NestJS), then fill in:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_OTP_FUNCTION_URL=
GOOGLE_BOOKS_API_KEY=
ANTHROPIC_API_KEY=
FRONTEND_URL=https://localhost
PORT=3000
```
Both `.env` files are git-ignored.

### 2. Database
Apply the migrations in `supabase/migrations/` to your Supabase project (Supabase SQL editor or CLI). Make sure these are applied: the Day-12 `user_books` columns, `review_likes`, and `user_last_seen` (`last_seen_at`).

### 3. (Recommended) Trust a local certificate for HTTPS + PWA
A self-signed cert works out of the box but Chrome shows a warning and won't register the service worker. For a clean console + installable PWA:
```bash
mkcert -install
mkcert -cert-file certs/selfsigned.crt -key-file certs/selfsigned.key localhost 127.0.0.1
```

### 4. Run with Docker (single command)
```bash
docker compose up --build
```
Then open **https://localhost**. The backend is not exposed publicly — it's reached only through the nginx `/api` proxy on the internal Docker network.

### 5. Local development (alternative)
```bash
npm install
npm run dev          # Angular dev server (http://localhost:4200) + NestJS together
# or run them separately:
npm start            # Angular  → http://localhost:4200
cd backend && npm run start:dev   # NestJS → http://localhost:3000
```

### Verify
```bash
curl -k https://localhost/api/health   # → {"status":"ok"}
```

---

## Team information

A three-person team; every member was a full-stack developer, with one additional role each.

| Member (login) | Role(s) | Responsibilities |
|---|---|---|
| `ratwi` | Product Owner / Developer | Product vision, feature validation and acceptance |
| `skreik` | Project Manager (Scrum Master) / Developer | Planning, task tracking, coordination |
| `issabr` | Technical Lead / Developer | Architecture, tech-stack decisions, code review, deployment (Docker/nginx/HTTPS) |

---

## Project management

- **Task organization:** Notion board for the backlog, per-feature tasks, specs, the module breakdown, and meeting notes.
- **Workflow:** feature branches merged to `main` (current working branch: `issabr`).

---

## Individual contributions

Detailed breakdown per member of the main areas each person worked on.

- **`ratwi` — Full-stack & AI.** Full-stack feature work (Angular components + NestJS endpoints) across the app, plus ownership of the three AI modules: the Claude-powered **recommendation engine**, **content moderation** of posts and comments, and **sentiment analysis**.
- **`issabr` — Full-stack & DevOps.** Full-stack feature work plus the deployment and infrastructure: **Docker Compose**, **nginx** (TLS termination + `/api` proxy), **HTTPS** setup, and the **PWA** (service worker + manifest).
- **`skreik` — QA, Supabase & database schema.** Designed and maintained the **Supabase** database — schema, tables and relationships, **Row-Level Security** policies, and the migrations in `supabase/migrations/`. Also handled QA: manual testing and verification of features, bug reporting and tracking, and validating each module against the subject requirements ahead of the defense.

---

## Resources

References used:
- [Angular documentation](https://angular.dev)
- [NestJS documentation](https://docs.nestjs.com)
- [Supabase documentation](https://supabase.com/docs) (Auth, Realtime, Storage, RLS)
- [Anthropic Claude API documentation](https://docs.anthropic.com)
- [Google Books API](https://developers.google.com/books)
- [MDN Web Docs](https://developer.mozilla.org) (CSS grid/flexbox, service workers, CSP)
- [Angular service worker / PWA guide](https://angular.dev/ecosystem/service-workers)
- [mkcert](https://github.com/FiloSottile/mkcert) for locally-trusted HTTPS

### How AI was used
AI was used in two distinct ways:

1. **As product features** (the AI modules): the **Anthropic Claude API** powers the book **recommendation engine** (personalized suggestions from a user's genres/ratings/history), **content moderation** of community posts, and **sentiment analysis** of post text.
2. **As a development assistant**: we used an AI coding assistant to help scaffold boilerplate, debug issues (e.g. CSS responsive-layout bugs, service-worker/HTTPS configuration), and draft documentation. All AI-assisted code was reviewed, tested, and is understood by the team — per the curriculum guidance, we only kept what we can explain and take responsibility for.

---

## Known limitations
- The bundled TLS certificate is **self-signed**; for a warning-free experience (and PWA install) provide a locally-trusted cert via mkcert (see Instructions).
- AI recommendations are **cached for 24h** per user; clearing the `ai_recommendations` row forces a refresh.
- When the Anthropic or Google Books API key is missing/exhausted, the app degrades gracefully (mock recommendations / local title search) rather than failing.

## License
For educational use as part of the 42 curriculum.