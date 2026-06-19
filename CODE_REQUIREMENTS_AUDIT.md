# Strict Code-Only Requirements Audit

> Audit basis: application code, configuration, database migrations, and executable build/type-check commands only. README files and existing requirement/audit documents were not used. The duplicated requirements in the supplied input were consolidated and audited once.

## Status legend

- **DONE** — the code satisfies the stated requirement.
- **PARTIAL** — meaningful implementation exists, but at least one explicit part is missing or too limited.
- **NOT DONE** — the required capability is absent or the existing code does not satisfy the requirement as written.

## Executive summary

| ID | Module | Small summary | Status |
|---|---|---|---|
| M1 | Advanced analytics dashboard | Stats page with rankings, genre bars, and a monthly reading bar chart; lacks live updates, exports, multiple chart types, and custom dates. | **PARTIAL** |
| M2 | ML recommendation system | AI/content-based book suggestions use genres, ratings, and reading history; no feedback loop or measured improvement over time. | **PARTIAL** |
| M3 | User management and authentication | Profile editing, avatar upload/fallback, friends, online status, and public profile routes are implemented. | **DONE** |
| M4 | Frontend and backend frameworks | Angular frontend and NestJS backend are both actively used. | **DONE** |
| M5 | Real-time features | Supabase Realtime updates notifications, but real-time behavior is narrow and connection lifecycle handling is incomplete. | **PARTIAL** |
| M6 | Public secured database API | Internal authenticated API exists, but there is no consumer API key, public API module, complete rate limiting, Swagger/OpenAPI, or PUT endpoint. | **NOT DONE** |
| m1 | Content moderation AI | AI moderation blocks flagged/rejected posts and comments before publication. | **PARTIAL** |
| m2 | Sentiment analysis | AI sentiment is stored and displayed for posts, but not for comments or other user-generated content. | **PARTIAL** |
| m3 | User activity analytics | Reading pace and aggregate community statistics exist, but this is not a comprehensive user activity insights system. | **PARTIAL** |
| m4 | OAuth 2.0 | Google OAuth login and callback handling are implemented through Supabase Auth. | **DONE** |
| m5 | Advanced search | Book search is paginated and shelf data can be filtered/sorted, but no single search supports filters, sorting, and pagination together. | **PARTIAL** |
| m6 | Three-language i18n | English, Arabic, and French plus a switcher exist; some visible/fallback strings remain hard-coded. | **PARTIAL** |
| m7 | RTL support | Arabic switches the document to RTL and has several RTL fixes, but complete layout mirroring is not demonstrated. | **PARTIAL** |

## Major requirements

### M1. Advanced analytics dashboard with data visualization — PARTIAL

**Module summary:** `/stats` displays global book/community statistics and a user's reading pace. Visuals are handcrafted HTML/CSS bars rather than a full charting system.

**Code evidence**

- Protected stats route: `src/app/app.routes.ts:94`
- Stats page loading global and user pace data: `src/app/features/stats/stats-page.component.ts:79`
- Backend statistics endpoints: `backend/src/stats/stats.controller.ts:8`
- Server-side/fallback aggregation: `backend/src/stats/stats.service.ts:55`
- Genre percentage bars: `src/app/features/stats/stats-page.component.html:85`
- Monthly reading bar chart: `src/app/features/stats/stats-page.component.html:170`

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| Advanced analytics dashboard | **PARTIAL** | A real dashboard exists, but the analytics are limited to top books, trending genres, top readers, and yearly reading pace. It lacks deeper drill-down, comparisons, retained filter state, and broader activity insights. |
| Interactive charts and graphs (line, bar, pie, etc.) | **PARTIAL** | Bar-style visualizations exist and rows link to details. There is no line chart, pie/donut chart, chart tooltip, legend interaction, zoom, series toggle, or chart library. |
| Real-time data updates | **NOT DONE** | The stats page fetches on initialization and when the week/month toggle changes. It has no Realtime/WebSocket subscription, polling, refresh control, or push update. |
| Export functionality (PDF, CSV, etc.) | **NOT DONE** | No stats export, CSV generation, PDF generation, print view, download button, or export endpoint exists. |
| Customizable date ranges and filters | **PARTIAL** | Only fixed `week` and `month` options exist for global stats. There is no start/end date selector, arbitrary range, year selection, or multi-dimensional filters. |

**What must be done to mark M1 DONE**

1. Add at least three meaningful chart types, such as line/area for reading pace, bar for rankings, and pie/donut for genre distribution.
2. Add accessible interactions: tooltips, keyboard focus, legends, series toggles, and drill-down behavior.
3. Add `from`/`to` date parameters to the backend, validate them, and apply them consistently to every relevant query/RPC.
4. Add UI date pickers plus useful filters such as genre, reading status, and scope.
5. Subscribe to relevant database changes or implement a documented polling/refetch strategy so visible analytics update while the page is open.
6. Add CSV export and PDF/print export using the currently selected range and filters.
7. Add tests for aggregation accuracy, date boundaries, empty data, export contents, and live refresh behavior.

### M2. Recommendation system using machine learning — PARTIAL

**Module summary:** The backend asks an Anthropic model for content-based book recommendations and enriches them through Google Books. Inputs include preferred genres, ratings, and recent reading history.

**Code evidence**

- Personalized recommendation endpoint: `backend/src/recommendations/recommendations.controller.ts:36`
- User genres, ratings, and read books are collected: `backend/src/recommendations/recommendations.service.ts:128`
- Content-based model prompt: `backend/src/recommendations/recommendations.service.ts:269`
- Twenty-four-hour recommendation cache: `backend/src/recommendations/recommendations.service.ts:367`
- Frontend recommendation retrieval: `src/app/core/services/book.service.ts:277`

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| Personalized recommendations based on user behavior | **DONE** | Recommendations use favorite genres, ratings, and books marked read. |
| Collaborative filtering or content-based filtering | **DONE** | The implementation is content-based: user preferences/history are supplied to an AI model to select similar books. Collaborative filtering is not required because the requirement allows either approach. |
| Continuously improve recommendations over time | **NOT DONE** | New requests can use newer shelf/rating data after cache expiry, but there is no explicit feedback collection, acceptance/dismissal signal, cache invalidation on behavior changes, ranking evaluation, model update, or learning loop. |

**What must be done to mark M2 DONE**

1. Record recommendation impressions, clicks, shelf additions, dismissals, ratings, and completion outcomes.
2. Invalidate or recompute cached recommendations when important behavior changes instead of waiting up to 24 hours.
3. Feed positive and negative signals into ranking, with safeguards against repeatedly suggesting dismissed/read books.
4. Add a reproducible recommender evaluation process using metrics such as click-through, save rate, precision@K, diversity, and coverage.
5. Version recommendation logic/prompts and store why each item was recommended.
6. Remove production mock recommendations or clearly restrict them to development/test mode.
7. Add tests proving personalization changes when behavior changes and proving excluded books are not recommended again.

### M3. Standard user management and authentication — DONE

**Module summary:** Supabase Auth provides account/session handling; the profile module supports editable user data, avatars, friendships, online indicators, privacy, and user profile pages.

**Code evidence**

- Profile routes for current and selected users: `src/app/app.routes.ts:60`, `src/app/app.routes.ts:68`
- Profile update service: `src/app/core/services/user.service.ts:219`
- Avatar upload and removal: `src/app/core/services/user.service.ts:100`, `src/app/core/services/user.service.ts:128`
- Profile avatar fallback to initials: `src/app/features/profile/profile-page.component.html:82`
- Friend request/accept/reject/delete API: `backend/src/friends/friends.controller.ts:21`
- Friend list and online indicators: `src/app/features/profile/profile-page.component.html:480`
- Presence heartbeat and batched status lookup: `src/app/core/services/presence.service.ts:6`

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| Users can update profile information | **DONE** | Name, username, bio, privacy, genres, reading goal, and avatar-related data can be updated. |
| Users can upload an avatar, with a default if none is provided | **DONE** | Validated image upload exists. Initials/generated-avatar fallbacks are rendered when the stored avatar is null. |
| Users can add friends and see online status | **DONE** | Friend request lifecycle is implemented. Accepted friends receive online/offline indicators based on `last_seen_at`. |
| Users have a profile page displaying their information | **DONE** | Current-user and other-user profile routes display identity, bio, stats, posts, genres, friends, and privacy-aware content. |

**Completion note**

This module meets the listed requirements. For stronger production quality, add automated tests for authorization, avatar limits/content inspection, friendship races, and presence timeout behavior. The heartbeat status is approximate presence, not an exact socket connection state.

### M4. Use a framework for both frontend and backend — DONE

**Module summary:** The client is an Angular 19 application and the server is a modular NestJS application.

| Explicit requirement | Verdict | Evidence |
|---|---|---|
| Frontend framework | **DONE** | Angular packages and Angular build configuration are present in `package.json` and `angular.json`. Standalone components and Angular Router are used throughout `src/app`. |
| Backend framework | **DONE** | NestJS modules/controllers/services are present under `backend/src`; `backend/src/main.ts` bootstraps `AppModule`. |

**Verification**

- Frontend TypeScript check passed: `node_modules/.bin/tsc.cmd -p tsconfig.app.json --noEmit`.
- Backend build passed: `npm.cmd run build` in `backend`.
- The full Angular production bundle could not be conclusively verified in the restricted audit environment because the Angular compiler was denied filesystem traversal while resolving files that are present. This is an environment limitation, not evidence that M4 is missing.

### M5. Real-time features using WebSockets or similar technology — PARTIAL

**Module summary:** Supabase Realtime listens for notification inserts for the current user. Presence uses periodic database heartbeats rather than a real-time presence channel.

**Code evidence**

- Notifications table added to Supabase Realtime publication: `supabase/migrations/20260511000000_day5_notifications.sql:7`
- User-filtered Realtime channel: `src/app/core/services/notifications.service.ts:140`
- Debounced server reconciliation after events: `src/app/core/services/notifications.service.ts:157`
- Explicit unsubscribe: `src/app/core/services/notifications.service.ts:208`
- Presence heartbeat every two minutes: `src/app/core/services/presence.service.ts:44`

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| Real-time updates across clients | **PARTIAL** | Notification inserts update another logged-in client in real time. Posts, comments, likes, friendships, analytics, and presence are not broadly synchronized through real-time subscriptions. |
| Handle connection/disconnection gracefully | **PARTIAL** | Duplicate subscription prevention and explicit unsubscribe exist. There is no channel-status callback, user-visible degraded state, reconnect/backoff policy, stale-channel recovery, or presence cleanup on browser disconnect. |
| Efficient message broadcasting | **PARTIAL** | Notification events are filtered by `user_id` and list refetches are debounced, which is efficient for this one case. There is no general broadcast architecture, room/topic strategy, authorization policy, or load/scaling verification. |

**What must be done to mark M5 DONE**

1. Define which product events must be live and implement them consistently—at minimum notifications plus another shared feature such as posts/comments/likes or analytics.
2. Use channel status callbacks to handle `SUBSCRIBED`, timeout, channel error, and closed states.
3. Add reconnection with bounded exponential backoff and resynchronization after reconnect.
4. Replace or supplement heartbeat presence with Supabase Presence/WebSocket presence and remove users promptly on disconnect.
5. Keep channels narrowly scoped by user/room and enforce authorization/RLS for every real-time table.
6. Add integration tests with two clients covering delivery, disconnect, reconnect, duplicate-event protection, and unauthorized subscriptions.
7. Document scaling behavior and verify that bursts are batched/debounced without losing events.

### M6. Public database API with API key, rate limiting, documentation, and at least five endpoints — NOT DONE

**Module summary:** The NestJS server exposes many application endpoints, mostly protected by Supabase bearer sessions. This is an internal application API, not the required public API product.

**Code evidence**

- Global `/api` prefix: `backend/src/main.ts:15`
- Existing application controllers: `backend/src/app.module.ts:12`
- Rate limiting is applied only to three auth routes: `backend/src/app.module.ts:21`
- In-memory rate limiter: `backend/src/common/rate-limit.middleware.ts:8`
- No API-key guard/middleware, public route group, Swagger setup, or `@Put` controller method exists under `backend/src`.

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| Public API that interacts with the database | **NOT DONE** | Existing endpoints are application endpoints and commonly require a user's Supabase JWT. No intentionally public, versioned consumer API is defined. |
| Secured API key | **NOT DONE** | No `X-API-Key`/consumer-key validation, key hashing, key ownership, scopes, rotation, revocation, or audit usage exists. Supabase and Google provider keys are not a substitute for a public API consumer key. |
| Rate limiting | **NOT DONE** | The only custom limiter protects three authentication endpoints. It is not applied to a public API route group and is process-local, so it would not enforce a global limit across multiple server instances. |
| Documentation | **NOT DONE** | No Swagger/OpenAPI dependency, bootstrap configuration, decorators, generated schema, or API documentation route exists. |
| At least five endpoints | **NOT DONE as a complete requirement** | The internal API has more than five routes, but the required secured public API does not exist. |
| `GET /api/{something}` | **PARTIAL foundation** | Many internal GET routes exist. |
| `POST /api/{something}` | **PARTIAL foundation** | Many internal POST routes exist. |
| `PUT /api/{something}` | **NOT DONE** | No NestJS `@Put` endpoint exists. PATCH is not PUT. |
| `DELETE /api/{something}` | **PARTIAL foundation** | Several internal DELETE routes exist. |

**What must be done to mark M6 DONE**

1. Create a versioned route group such as `/api/public/v1`.
2. Create an API-key table containing only hashed keys plus owner, prefix, scopes, status, creation, expiry, and last-used metadata.
3. Add an API-key guard that reads a documented header such as `X-API-Key`, compares safely, rejects inactive/expired keys, and applies scopes.
4. Add distributed rate limiting backed by Redis or another shared store, with per-key quotas and standard rate-limit response headers.
5. Implement at least five real database endpoints, including explicit GET, POST, PUT, and DELETE operations.
6. Validate all request DTOs and enforce database authorization independently of the key's mere validity.
7. Add Swagger/OpenAPI with API-key security scheme, schemas, examples, pagination, errors, and rate-limit behavior.
8. Add key creation/rotation/revocation tooling without ever returning or logging an existing full key.
9. Add tests for missing/invalid/revoked keys, scopes, quotas, all CRUD verbs, validation, and database effects.

## Minor requirements

### m1. Content moderation AI — PARTIAL

**Module summary:** Anthropic classifies posts/comments as approved, flagged, or rejected. Flagged and rejected submissions receive `422` and are not inserted.

**Code evidence**

- AI moderation policy and structured result: `backend/src/community/community.service.ts:247`
- Blocked post insertion: `backend/src/community/community.service.ts:297`
- Same moderation gate for comments: `backend/src/community/community.service.ts:327`
- Feed hides legacy flagged/rejected posts: `backend/src/community/community.service.ts:183`

**Why this is not fully DONE**

- If `ANTHROPIC_API_KEY` is absent, moderation silently approves content as neutral.
- Rejected attempts are not stored in a moderation audit queue, so moderators cannot review false positives/negatives.
- There is no warning/strike/escalation system or administrative review workflow.
- Automated tests for policy classes and AI failure modes are not present.

**What must be done to mark it DONE**

Fail closed in production when moderation is unavailable or use a second deterministic/provider fallback; store safe moderation audit metadata; add review/appeal and warning/escalation behavior; and add policy tests for allowed criticism, profanity, spam, harassment, hate, explicit content, prompt injection, provider failure, and malformed model output.

### m2. Sentiment analysis for user-generated content — PARTIAL

**Module summary:** The same AI call assigns positive, negative, neutral, or mixed sentiment to posts, and the community UI displays a localized badge.

**Code evidence**

- Sentiment model output: `backend/src/community/community.service.ts:259`
- Post sentiment stored in the database: `backend/src/community/community.service.ts:315`
- Sentiment badge in the community UI: `src/app/features/community/community-page.component.html:232`

**Missing**

- Comment sentiment is calculated by `moderateAndAnalyze` but discarded and not stored.
- Existing reviews and other user-generated text are not analyzed.
- No backfill, confidence score, language-quality validation, reporting, or aggregate sentiment insight exists.

**What must be done to mark it DONE**

Define the exact UGC types in scope, persist sentiment for each, add confidence/model/version metadata, support backfill/re-analysis, expose sentiment in analytics where useful, and add multilingual accuracy tests for English, Arabic, and French.

### m3. User activity analytics and insights dashboard — PARTIAL

**Module summary:** The stats page gives a user monthly books-read counts and global rankings, while the profile page shows reading totals and goals.

**Implemented**

- Yearly monthly reading pace.
- Books read this year and reading goal.
- Global top books, genres, and readers.

**Missing**

- No activity event model for sessions, searches, clicks, recommendations, posts, comments, likes, or retention.
- No personal trend comparisons, streaks, engagement breakdown, completion time, goal projection, or actionable insights.
- No custom range, export, live update, or drill-down.

**What must be done to mark it DONE**

Create privacy-aware activity events, aggregate them server-side, define useful user-level metrics, provide a dedicated insights dashboard with comparisons and trends, add date/filter/export support, and test event correctness and aggregation boundaries.

### m4. Remote authentication with OAuth 2.0 — DONE

**Module summary:** Google OAuth is initiated through Supabase Auth and completed through an application callback route.

**Code evidence**

- OAuth call: `src/app/core/services/supabase.service.ts:126`
- Google button action: `src/app/features/auth/auth-page.component.ts:225`
- OAuth callback route: `src/app/app.routes.ts:24`
- Session exchange and public-user synchronization: `src/app/core/services/supabase.service.ts:176`

**Completion note**

Google satisfies the “Google, GitHub, 42, etc.” requirement. Add state/error/provider-linking tests and document provider configuration for production readiness.

### m5. Advanced search with filters, sorting, and pagination — PARTIAL

**Module summary:** Google Books search supports debounced text queries and offset pagination. Separately, the shelf supports status filters and date/title/rating sorting.

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| Search | **DONE** | Text search is implemented through `/api/books/search`. |
| Filters | **PARTIAL** | Shelf status filters exist, but book search has no author, genre, year, language, availability, or other search filters. |
| Sorting | **PARTIAL** | Shelf sorting exists, but book search results cannot be sorted by relevance, date, title, rating, etc. |
| Pagination | **DONE** | Google Books search uses `startIndex`, `maxResults`, total count, and “load more.” Community posts also accept a page. |

**What must be done to mark it DONE**

Implement one coherent advanced search endpoint and UI that accepts a validated query, multiple filters, a sort field/direction, and page/cursor parameters together. Return pagination metadata, preserve parameters in the URL, add indexes for database-backed fields, and test combinations, invalid values, stable ordering, empty pages, and maximum page size.

### m6. Multiple languages: i18n and at least three complete translations — PARTIAL

**Module summary:** A custom translation system supports English, Arabic, and French, persists the chosen language, and includes a UI language selector.

**Code evidence**

- Language type includes three languages: `src/app/i18n/language.model.ts:1`
- Language options and directions: `src/app/i18n/languages.ts:3`
- Translation store for EN/AR/FR: `src/app/i18n/services/translation.service.ts:26`
- Language selector: `src/app/i18n/components/language-selector.component.ts:9`
- Global live language updates: `src/app/app.ts:27`

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| i18n system | **DONE** | A reusable translation service and typed page dictionaries are implemented. |
| At least three complete language translations | **PARTIAL** | EN/AR/FR dictionaries exist for major modules, but completeness is not enforced by automated parity tests and visible fallback strings remain outside dictionaries. |
| Language switcher in UI | **DONE** | A reusable selector changes and persists language. |
| All user-facing text translatable | **NOT DONE** | Examples include the shelf's hard-coded singular/plural `book/books`, fallback `a friend`, progress suffix `p`, and several raw/fallback service messages. Some brand text can reasonably remain unchanged, but functional UI text must not. |

**What must be done to mark it DONE**

1. Move every visible functional string, placeholder, aria label, fallback, toast, validation message, and plural form into translation dictionaries.
2. Use locale-aware pluralization and number/date formatting rather than English string concatenation.
3. Add a compile/test-time key-parity check ensuring every language has every required key.
4. Add missing-key detection that fails tests instead of rendering the key or an English fallback.
5. Test all routes in each language, including backend error mapping and empty/error/loading states.

### m7. Right-to-left language support — PARTIAL

**Module summary:** Selecting Arabic sets the root document to RTL and applies several global/component-specific corrections, including mirrored back arrows.

**Code evidence**

- Root `dir` and `lang` switch live with language: `src/app/app.ts:30`
- Global RTL alignment and arrow mirroring: `src/styles.scss:89`, `src/styles.scss:181`
- RTL-aware privacy toggle using logical inset: `src/styles.scss:145`
- Language menu/auth RTL adjustments: `src/app/i18n/components/language-selector.component.scss:134`, `src/app/features/auth/auth-page.component.scss:658`

| Explicit requirement | Verdict | Strict finding |
|---|---|---|
| At least one RTL language | **DONE** | Arabic is provided and sets `dir="rtl"`. |
| Complete layout mirroring, not only text direction | **PARTIAL** | Some arrows and controls are mirrored, but many component styles still use physical `left`, `right`, `margin-left`, `padding-left`, `border-left`, and inline left padding without corresponding global RTL rules. |
| RTL-specific UI adjustments | **PARTIAL** | Several targeted fixes exist, but coverage is inconsistent across profile, search, shelf, comments, navigation, and positioned controls. |
| Seamless LTR/RTL switching | **PARTIAL** | Switching updates the root immediately, but complete visual correctness has not been demonstrated by automated or screenshot tests. |

**What must be done to mark it DONE**

1. Replace directional CSS with logical properties: `inset-inline-*`, `margin-inline-*`, `padding-inline-*`, `border-inline-*`, and logical text alignment.
2. Remove directional inline styles such as `padding-left` and `margin-right`, or bind them to direction-aware classes.
3. Audit directional icons and animations individually; mirror only icons whose meaning changes with direction.
4. Verify dropdowns, overlays, forms, charts, progress bars, nested comments, and responsive layouts in Arabic.
5. Add route-level RTL screenshot tests at desktop and mobile widths, plus a live EN → AR → FR switch test.

## Strict final verdict

- **Fully done:** M3, M4, m4.
- **Partially done:** M1, M2, M5, m1, m2, m3, m5, m6, m7.
- **Not done:** M6.

The highest-priority missing work is the public API requirement, followed by completing analytics exports/date ranges/live updates, adding a genuine recommendation feedback loop, and finishing i18n/RTL completeness.
