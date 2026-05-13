-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  achievement_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  achievement_name character varying NOT NULL,
  description text,
  CONSTRAINT achievements_pkey PRIMARY KEY (achievement_id)
);
CREATE TABLE public.badge_achievements (
  badge_id integer NOT NULL,
  achievement_id integer NOT NULL,
  CONSTRAINT badge_achievements_pkey PRIMARY KEY (badge_id, achievement_id),
  CONSTRAINT fk_badge_achievements_badge_id FOREIGN KEY (badge_id) REFERENCES public.badges(badge_id),
  CONSTRAINT fk_badge_achievements_achievement_id FOREIGN KEY (achievement_id) REFERENCES public.achievements(achievement_id)
);
CREATE TABLE public.badges (
  badge_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  badge_name character varying NOT NULL,
  description text,
  CONSTRAINT badges_pkey PRIMARY KEY (badge_id)
);
CREATE TABLE public.book_genres (
  book_id integer NOT NULL,
  genre_id integer NOT NULL,
  CONSTRAINT book_genres_pkey PRIMARY KEY (book_id, genre_id),
  CONSTRAINT fk_book_genres_book_id FOREIGN KEY (book_id) REFERENCES public.books(book_id),
  CONSTRAINT fk_book_genres_genre_id FOREIGN KEY (genre_id) REFERENCES public.genres(genre_id)
);
CREATE TABLE public.book_note_likes (
  book_id integer NOT NULL,
  note_id integer NOT NULL,
  is_liked boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT fk_book_note_likes_book_id FOREIGN KEY (book_id) REFERENCES public.books(book_id),
  CONSTRAINT fk_book_note_likes_note_id FOREIGN KEY (note_id) REFERENCES public.user_books(note_id),
  CONSTRAINT book_note_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.books (
  book_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  title character varying NOT NULL,
  author_name character varying NOT NULL,
  description text,
  publish_date date,
  cover_image_url character varying,
  CONSTRAINT books_pkey PRIMARY KEY (book_id)
);
CREATE TABLE public.comment_likes (
  comment_id integer NOT NULL,
  is_liked boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT fk_comment_likes_comment_id FOREIGN KEY (comment_id) REFERENCES public.comments(comment_id),
  CONSTRAINT comment_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.comment_moderation (
  moderation_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  comment_id integer NOT NULL,
  sentiment_score numeric,
  sentiment_label character varying,
  toxicity_score numeric,
  action_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT comment_moderation_pkey PRIMARY KEY (moderation_id),
  CONSTRAINT fk_comment_moderation_comment_id FOREIGN KEY (comment_id) REFERENCES public.comments(comment_id),
  CONSTRAINT fk_comment_moderation_action_id FOREIGN KEY (action_id) REFERENCES public.moderation_actions(action_id)
);
CREATE TABLE public.comments (
  comment_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id integer NOT NULL,
  content text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  is_moderated boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  user_id uuid,
  CONSTRAINT comments_pkey PRIMARY KEY (comment_id),
  CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id) REFERENCES public.posts(post_id),
  CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.friendship (
  friendship_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  status_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  user_id1 uuid,
  user_id2 uuid,
  CONSTRAINT friendship_pkey PRIMARY KEY (friendship_id),
  CONSTRAINT fk_friendship_status_id FOREIGN KEY (status_id) REFERENCES public.friendship_status(status_id),
  CONSTRAINT friendship_user_id1_fkey FOREIGN KEY (user_id1) REFERENCES auth.users(id),
  CONSTRAINT friendship_user_id2_fkey FOREIGN KEY (user_id2) REFERENCES auth.users(id)
);
CREATE TABLE public.friendship_status (
  status_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  status_name character varying NOT NULL UNIQUE,
  CONSTRAINT friendship_status_pkey PRIMARY KEY (status_id)
);
CREATE TABLE public.genres (
  genre_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  genre_name character varying NOT NULL UNIQUE,
  CONSTRAINT genres_pkey PRIMARY KEY (genre_id)
);
CREATE TABLE public.language (
  language_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  language character varying,
  CONSTRAINT language_pkey PRIMARY KEY (language_id)
);
CREATE TABLE public.moderation_actions (
  action_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  action_name character varying NOT NULL UNIQUE,
  CONSTRAINT moderation_actions_pkey PRIMARY KEY (action_id)
);
CREATE TABLE public.notifications (
  notification_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  notifications_typeid integer NOT NULL,
  read_status boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  actor_user_id uuid,
  CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT fk_notifications_type FOREIGN KEY (notifications_typeid) REFERENCES public.notifications_type(notifications_typeid),
  CONSTRAINT notifications_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications_type (
  notifications_typeid integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  notifications_type character varying,
  CONSTRAINT notifications_type_pkey PRIMARY KEY (notifications_typeid)
);
CREATE TABLE public.post_likes (
  post_id integer NOT NULL,
  is_liked boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT fk_post_likes_post_id FOREIGN KEY (post_id) REFERENCES public.posts(post_id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.post_moderation (
  moderation_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  post_id integer NOT NULL,
  sentiment_score numeric,
  sentiment_label character varying,
  toxicity_score numeric,
  action_id integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT post_moderation_pkey PRIMARY KEY (moderation_id),
  CONSTRAINT fk_post_moderation_post_id FOREIGN KEY (post_id) REFERENCES public.posts(post_id),
  CONSTRAINT fk_post_moderation_action_id FOREIGN KEY (action_id) REFERENCES public.moderation_actions(action_id)
);
CREATE TABLE public.post_tags (
  post_id integer NOT NULL,
  tag_id integer NOT NULL,
  CONSTRAINT post_tags_pkey PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tags_post_id FOREIGN KEY (post_id) REFERENCES public.posts(post_id),
  CONSTRAINT fk_post_tags_tag_id FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id)
);
CREATE TABLE public.posts (
  post_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  book_id integer NOT NULL,
  content text NOT NULL,
  is_moderated boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT posts_pkey PRIMARY KEY (post_id),
  CONSTRAINT fk_posts_book_id FOREIGN KEY (book_id) REFERENCES public.books(book_id),
  CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  name text,
  otp integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reading_goals (
  goal_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  year integer NOT NULL,
  target_books integer NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone,
  user_id uuid,
  CONSTRAINT reading_goals_pkey PRIMARY KEY (goal_id),
  CONSTRAINT reading_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reading_statuses (
  status_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  status_name character varying NOT NULL UNIQUE,
  CONSTRAINT reading_statuses_pkey PRIMARY KEY (status_id)
);
CREATE TABLE public.tags (
  tag_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  tag_name character varying NOT NULL UNIQUE,
  CONSTRAINT tags_pkey PRIMARY KEY (tag_id)
);
CREATE TABLE public.user_badges (
  badge_id integer NOT NULL,
  date_earned timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT fk_user_badges_badge_id FOREIGN KEY (badge_id) REFERENCES public.badges(badge_id),
  CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_books (
  user_book_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  book_id integer NOT NULL,
  note_id integer NOT NULL UNIQUE,
  status_id integer NOT NULL,
  rating integer,
  note text,
  is_public boolean DEFAULT true,
  added_at timestamp without time zone DEFAULT now(),
  read_at timestamp without time zone,
  updated_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  friend_recommended_by uuid,
  CONSTRAINT user_books_pkey PRIMARY KEY (user_book_id),
  CONSTRAINT fk_user_books_book_id FOREIGN KEY (book_id) REFERENCES public.books(book_id),
  CONSTRAINT fk_user_books_status_id FOREIGN KEY (status_id) REFERENCES public.reading_statuses(status_id),
  CONSTRAINT user_books_friend_recommended_by_fkey FOREIGN KEY (friend_recommended_by) REFERENCES auth.users(id),
  CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_genres (
  genre_id integer NOT NULL,
  user_id uuid,
  CONSTRAINT fk_user_genres_genre_id FOREIGN KEY (genre_id) REFERENCES public.genres(genre_id),
  CONSTRAINT user_genres_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_preferred_languages (
  language_id integer NOT NULL,
  user_id uuid,
  CONSTRAINT fk_user_preferred_languages_language_id FOREIGN KEY (language_id) REFERENCES public.language(language_id),
  CONSTRAINT user_preferred_languages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_reports (
  report_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  resolved_at timestamp without time zone,
  relevant boolean,
  reporter_user_id uuid,
  reported_user_id uuid,
  CONSTRAINT user_reports_pkey PRIMARY KEY (report_id),
  CONSTRAINT user_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id),
  CONSTRAINT user_reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_sessions (
  session_id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  started_at timestamp without time zone NOT NULL,
  ended_at timestamp without time zone NOT NULL,
  duration integer,
  created_at timestamp without time zone,
  user_id uuid,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id),
  CONSTRAINT fk_user_sessions_user_id FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  user_id integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE CHECK (email::text ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'::text),
  name character varying NOT NULL,
  about_me text,
  profile_picture_url character varying,
  preferred_language character varying,
  deleted_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone,
  id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  birthday date,
  username character varying UNIQUE,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_auth_fk FOREIGN KEY (id) REFERENCES auth.users(id)
);
