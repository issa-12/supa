-- ─────────────────────────────────────────────────────────────────────────
-- Allow deleting a user (and support GDPR-style account deletion).
--
-- Many tables referenced auth.users(id) with ON DELETE NO ACTION, so deleting
-- an auth user failed with "Database error deleting user" (Postgres refuses to
-- orphan child rows). This repoints those FKs to ON DELETE CASCADE so a user's
-- own data is removed with them. The lone exception is user_books.friend_recommended_by:
-- the recipient keeps their book, we just clear who recommended it (SET NULL).
--
-- Idempotent: drops the constraint if present, then re-adds it with the right rule.
-- ─────────────────────────────────────────────────────────────────────────

-- ── CASCADE: the user's own rows go away with the user ───────────────────────
alter table public.book_note_likes          drop constraint if exists book_note_likes_user_id_fkey;
alter table public.book_note_likes           add constraint book_note_likes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.comment_likes            drop constraint if exists comment_likes_user_id_fkey;
alter table public.comment_likes             add constraint comment_likes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.comments                 drop constraint if exists comments_user_id_fkey;
alter table public.comments                  add constraint comments_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.notifications            drop constraint if exists notifications_user_id_fkey;
alter table public.notifications             add constraint notifications_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.notifications            drop constraint if exists notifications_actor_user_id_fkey;
alter table public.notifications             add constraint notifications_actor_user_id_fkey
  foreign key (actor_user_id) references auth.users(id) on delete cascade;

alter table public.post_likes               drop constraint if exists post_likes_user_id_fkey;
alter table public.post_likes                add constraint post_likes_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.reading_goals            drop constraint if exists reading_goals_user_id_fkey;
alter table public.reading_goals             add constraint reading_goals_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_badges              drop constraint if exists user_badges_user_id_fkey;
alter table public.user_badges               add constraint user_badges_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_books               drop constraint if exists user_books_user_id_fkey;
alter table public.user_books                add constraint user_books_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_genres              drop constraint if exists user_genres_user_id_fkey;
alter table public.user_genres               add constraint user_genres_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_preferred_languages drop constraint if exists user_preferred_languages_user_id_fkey;
alter table public.user_preferred_languages  add constraint user_preferred_languages_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_sessions            drop constraint if exists user_sessions_user_id_fkey;
alter table public.user_sessions             add constraint user_sessions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- ── SET NULL: don't delete the recipient's book when the recommender leaves ──
alter table public.user_books               drop constraint if exists user_books_friend_recommended_by_fkey;
alter table public.user_books                add constraint user_books_friend_recommended_by_fkey
  foreign key (friend_recommended_by) references auth.users(id) on delete set null;
