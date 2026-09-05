_This project has been created as part of the 42 curriculum by `isalayan`, `ratwi`, `skreik`._

# FT Transcendence - ReadTrack

## Description

ReadTrack is a co-developed social reading platform built as part of the 42 Beirut ft_transcendence project. It lets users discover books, manage a personal shelf, follow friends, see online status, post in a moderated community feed, and receive personalized AI-powered book recommendations.

The project reimagines the ft_transcendence web application as a Goodreads-style reading network. It uses an Angular single-page frontend, a NestJS REST backend, Supabase for authentication/database/storage/realtime features, Google Books for book metadata, and Anthropic Claude for recommendations, moderation, and sentiment analysis.

Key features:

- Secure authentication with email OTP, email verification, password reset, Google OAuth, and optional two-factor authentication.
- Genre onboarding that personalizes the first user experience and gates the app until preferences are selected.
- Google Books-powered search with pagination, shared book catalogue records, and book detail pages.
- Personal shelf with Want to read, Currently reading, Read, and friend-recommended states.
- Reading progress, ratings, private notes, public reviews, and review reactions.
- Friend requests, friend lists, profile privacy controls, blocking/reporting, and online/offline presence.
- Real-time notifications for friend requests, likes, comments, and recommendations using Supabase Realtime.
- Community posts with book tagging, threaded comments, likes, tag filtering, and trending content.
- AI content moderation and sentiment analysis for community posts and comments.
- Claude-powered personalized book recommendations enriched with Google Books data and cached per user.
- Personal and global reading statistics, including top books, trending genres, top readers, and reading pace.
- English, Arabic, and French translations with Arabic RTL support.
- PWA support, responsive layouts, HTTPS through nginx, and Docker-based deployment.

## Instructions

Prerequisites:

- Docker and Docker Compose, recommended for the full HTTPS deployment.
- Node.js 20 and npm, if running the frontend/backend locally.
- A Supabase project.
- A Google Books API key.
- An Anthropic Claude API key.
- Optional: mkcert for a locally trusted HTTPS certificate.

Environment variables:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_OTP_FUNCTION_URL=
GOOGLE_BOOKS_API_KEY=
ANTHROPIC_API_KEY=
FRONTEND_URL=https://localhost
PORT=3000
```

Copy `.env.example` to `.env` at the repository root for Docker. For local backend development, also create `backend/.env` with the same required backend values. Both files are ignored by Git and must contain evaluator or local project secrets only.

Apply the Supabase migrations from `supabase/migrations/` to your Supabase project. The project also includes SQL setup files such as `database.sql` and `supabase-auth-setup.sql` for schema/auth context.

Recommended HTTPS certificate setup:

```sh
mkcert -install
mkcert -cert-file certs/selfsigned.crt -key-file certs/selfsigned.key localhost 127.0.0.1
```

Run with Docker:

```sh
docker compose up --build
```

Open the app at `https://localhost`. The NestJS backend is reached through the nginx `/api` proxy.

Run locally without Docker:

```sh
npm install
npm run dev
```

This starts the Angular dev server and the NestJS backend together. You can also run them separately:

```sh
npm start
cd backend
npm run start:dev
```

Useful checks:

```sh
npm run build
npm run test:i18n
curl -k https://localhost/api/health
```

## Team Information

- `ratwi`: Product Owner and full-stack developer.
- `skreik`: Project Manager/Scrum Master and full-stack developer.
- `isalayan`: Technical Lead and full-stack developer.

Every team member contributed across the stack, with additional ownership areas for product validation, planning/coordination, architecture, database work, QA, AI features, and deployment.

## Project Management

- Work was organized around the main product areas: authentication, books/shelf, profiles, friends, community, notifications, recommendations, statistics, localization, and deployment.
- Notion was used for backlog planning, feature tasks, module tracking, specifications, and meeting notes.
- Development used feature branches merged into `main`.
- The team reviewed functionality against the 42 subject modules and prepared live demonstrations for each claimed module.
- QA included manual feature testing, responsive layout checks, i18n parity checks, Supabase policy validation, and defense-focused verification.

## Technical Stack

- Frontend: Angular 19, standalone components, TypeScript, SCSS, RxJS, Angular Router, Angular service worker.
- Backend: NestJS 10, Node.js 20, REST controllers, modular services, Swagger tooling.
- Database/auth/storage/realtime: Supabase Postgres, Supabase Auth, Supabase Storage, Supabase Realtime, Row-Level Security.
- AI: Anthropic Claude API using `@anthropic-ai/sdk`.
- External data: Google Books API.
- Charts and exports: Chart.js, html2canvas, jsPDF.
- Deployment/runtime: Docker Compose, nginx, TLS certificates, internal backend proxying.
- PWA: `@angular/service-worker`, web manifest, generated app icons, offline app shell.

Supabase was chosen to centralize authentication, relational data, file storage, realtime notifications, and database security policies. NestJS owns server-side API logic, protected service-role operations, third-party API proxying, recommendation generation, moderation, statistics, and public API endpoints. Angular owns the interactive client experience, routing, localization, responsive UI, and PWA behavior.

## Database Schema

The application uses Supabase Auth with public Postgres tables protected by Row-Level Security.

Core tables and relationships:

- `users`: mirrors Supabase Auth users and stores profile-facing user data such as email, name, username, profile image, bio/about text, preferred language, timestamps, and soft deletion metadata.
- `profiles`: additional profile data linked to an authenticated user.
- `books`: shared catalogue records with title, author, description, publish date, and cover image URL.
- `user_books`: a user's shelf entry linked to `users`, `books`, and `reading_statuses`; stores reading status, rating, note, visibility, progress, timestamps, and friend recommendation metadata.
- `reading_statuses`: reference data for shelf states.
- `reading_goals`: annual user reading targets.
- `genres`, `book_genres`, and `user_genres`: genre reference data and many-to-many relationships for books and user preferences.
- `posts`: community posts linked to users and books, with moderation/deletion flags and timestamps.
- `comments`: comments linked to posts and users, with moderation/deletion flags.
- `post_likes`, `comment_likes`, and `book_note_likes`: reaction tables for social engagement.
- `post_moderation` and `comment_moderation`: AI moderation/sentiment records linked to moderation actions.
- `tags` and `post_tags`: tag reference data and many-to-many post tagging.
- `friendship` and `friendship_status`: friend request, accepted, rejected, and blocked states.
- `notifications` and `notifications_type`: recipient/actor notification records and notification type reference data.
- `user_reports`: report records for user safety workflows.
- `badges`, `achievements`, `badge_achievements`, and `user_badges`: gamified achievement metadata.
- `language` and `user_preferred_languages`: language preference support.
- `user_sessions`: user activity session tracking.
- `ai_recommendations`: cached personalized recommendation data created by the backend.

Security and integrity notes:

- Row-Level Security policies protect user data and social interactions.
- Authenticated users can manage their own profile, shelf, preferences, and social actions within policy limits.
- Server-only service-role operations are kept in the backend and are never exposed to browser code.
- Migrations add hardening for book writes, private accounts, private notes, avatar storage, review likes, online presence, stats RPCs, API keys, and community realtime behavior.
- Uniqueness and foreign-key constraints protect user/book relationships, friend pairs, likes, tags, and recommendation state.

## Features List

### Frontend

- Authentication pages, OAuth callback, email verification, reset password, and route guards.
- Home dashboard with hero content, continue-reading card, recommendations, trending books, posts feed, and notifications panel.
- Book search and book detail pages with shelf actions, reviews, ratings, reactions, and friend recommendations.
- Personal shelf with reading statuses, progress, notes, ratings, reviews, filtering, and sorting.
- Community feed with posts, comments, likes, tags, moderation results, and translated UI text.
- Profile pages with avatar management, bio, username, reading goal, privacy, recent activity, and friend actions.
- Stats dashboard for personal reading pace and global reading insights.
- Settings page for public API keys.
- Responsive SCSS design system, shared dialogs/popups, icon usage, and PWA shell.
- English, Arabic, and French translations with RTL-aware Arabic layouts.

### Backend

- NestJS modules for auth, books, community, friends, notifications, recommendations, reports, stats, Supabase integration, health checks, and public API access.
- Google Books proxying and book catalogue enrichment.
- Claude-powered personalized recommendations, content moderation, and sentiment analysis.
- Supabase service integration for secure database operations and storage workflows.
- Friend request and notification business logic.
- Public shelf API guarded by API keys and rate limiting.
- Health endpoint for deployment verification.

### Database

- Supabase migrations for core reading/social tables, storage, RLS policies, private account behavior, reports, stats, API keys, realtime notifications, and performance indexes.
- Seed scripts for development and community test data.
- Row-Level Security and policy hardening across user-facing data.

### Deployment

- Dockerfile and Docker Compose setup for reproducible local/full deployment.
- nginx configuration for HTTPS termination, frontend serving, and `/api` proxying.
- Certificate helper script and bundled self-signed certificate path for local HTTPS.
- Vercel configuration for frontend-oriented deployment experiments.

## Modules

Official module set:

- Major: Advanced analytics dashboard with data visualization.
  - Interactive charts and graphs (line, bar, pie, etc.).
  - Real-time data updates.
  - Export functionality (PDF, CSV, etc.).
  - Customizable date ranges and filters.

- Major: Recommendation system using machine learning.
  - Personalized recommendations based on user behavior.
  - Collaborative filtering or content-based filtering.
  - Continuously improve recommendations over time.

- Major: Standard user management and authentication.
  - Users can update their profile information.
  - Users can upload an avatar, with a default avatar if none is provided.
  - Users can add other users as friends and see their online status.
  - Users have a profile page displaying their information.

- Major: Use a framework for both the frontend and backend.
  - Use a frontend framework (React, Vue, Angular, Svelte, etc.).
  - Use a backend framework (Express, NestJS, Django, Flask, Ruby on Rails, etc.).

- Major: Implement real-time features using WebSockets or similar technology.
  - Real-time updates across clients.
  - Handle connection/disconnection gracefully.
  - Efficient message broadcasting.

- Major: Public database API with security and documentation.
  - Use a secured API key.
  - Add rate limiting.
  - Provide documentation.
  - Include at least 5 endpoints: GET, POST, PUT, PATCH, and DELETE.

- Minor: Content moderation AI.
  - Auto moderation, auto deletion, auto warning, or similar moderation tools.

- Minor: Sentiment analysis for user-generated content.

- Minor: Implement remote authentication with OAuth 2.0.
  - Support a provider such as Google, GitHub, or 42.

- Minor: Advanced search with filters, sorting, and pagination.

- Minor: Support for multiple languages.
  - Implement an i18n system.
  - Provide at least 3 complete language translations.
  - Add a language switcher.
  - Make all user-facing text translatable.

- Minor: Right-to-left language support.
  - Support at least one RTL language such as Arabic or Hebrew.
  - Mirror the complete layout, not only text direction.
  - Include RTL-specific UI adjustments.
  - Allow seamless switching between LTR and RTL.

Additional module set:

- Additional: Advanced user safety and privacy controls.
  - Users can make their profile private.
  - Users can block and unblock other users.
  - Blocked users' profiles, posts, comments, and reviews are hidden.

- Additional: Advanced book tracking and social reading features.
  - Users can track reading progress.
  - Users can save private notes for books.
  - Users can rate and review books.
  - Users can like or dislike public reviews.

Total: 18 points.

## Individual Contributions

`ratwi`, acting as Product Owner and full-stack developer, contributed product vision, feature validation, acceptance criteria, Angular/NestJS feature work, and ownership of the AI modules: personalized recommendations, content moderation, and sentiment analysis.

`skreik`, acting as Project Manager/Scrum Master and full-stack developer, contributed planning, task tracking, team coordination, QA, manual verification, Supabase schema work, Row-Level Security policies, migrations, and module validation ahead of the defense.

`issabr`, acting as Technical Lead and full-stack developer, contributed architecture, technology decisions, code review, Angular/NestJS feature work, Docker Compose, nginx, HTTPS setup, deployment flow, and PWA configuration.

Main challenges included coordinating Supabase Auth with application user records, keeping Row-Level Security strict while preserving the social reading experience, making realtime notifications reliable, supporting privacy rules across shelf/profile/community views, integrating AI features safely, and maintaining responsive translated layouts across LTR and RTL languages.

## Resources

- Angular documentation: https://angular.dev
- NestJS documentation: https://docs.nestjs.com
- Supabase documentation: https://supabase.com/docs
- Anthropic Claude API documentation: https://docs.anthropic.com
- Google Books API documentation: https://developers.google.com/books
- RxJS documentation: https://rxjs.dev
- Chart.js documentation: https://www.chartjs.org/docs
- Docker documentation: https://docs.docker.com
- Nginx documentation: https://nginx.org/en/docs/
- Angular service worker/PWA guide: https://angular.dev/ecosystem/service-workers
- mkcert: https://github.com/FiloSottile/mkcert
- MDN Web Docs: https://developer.mozilla.org

AI usage: AI was used in two ways. As product functionality, the Anthropic Claude API powers recommendations, moderation, and sentiment analysis. As a development assistant, AI helped with debugging, documentation drafting, boilerplate support, refactoring suggestions, responsive-layout fixes, and review of edge cases. The team reviewed, tested, and kept responsibility for the final code.

## Known Limitations

- The included TLS certificate is self-signed; use mkcert for a warning-free local HTTPS/PWA experience.
- AI recommendations are cached for 24 hours per user.
- Missing or exhausted Google Books or Anthropic keys cause the app to fall back or degrade gracefully where supported.
- Live module demonstrations still require a correctly configured Supabase project, API keys, and applied migrations.

## License

For educational use as part of the 42 curriculum.
