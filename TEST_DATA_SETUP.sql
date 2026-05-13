-- Test Data Setup for ReadTrack
-- This script adds sample data to test the home page and profile functionality

-- 1. Add reading statuses (if not exist)
INSERT INTO public.reading_statuses (status_name) 
VALUES ('reading'), ('completed'), ('want_to_read'), ('dropped')
ON CONFLICT (status_name) DO NOTHING;

-- 2. Add sample books
INSERT INTO public.books (title, author_name, description, publish_date, cover_image_url) 
VALUES 
  ('The Silent Patient', 'Alex Michaelides', 'A shocking psychological thriller about a woman who shoots her husband and never speaks again.', '2019-02-06', 'https://storage.googleapis.com/banani-generated-images/generated-images/64482471-c91c-4668-b6f2-0b0db8a3d125.jpg'),
  ('The Maid', 'Nita Prose', 'A masterful debut mystery featuring Molly, a maid at the prestigious Bellamy Hotel who discovers her employer dead.', '2022-08-02', 'https://storage.googleapis.com/banani-generated-images/generated-images/08ab14c7-8ba7-43e7-8f04-4b47276a3634.jpg'),
  ('Yellowface', 'R.F. Kuang', 'A scorching satire about identity, ambition, and the publishing industry that examines what it means to claim space.', '2023-05-16', 'https://storage.googleapis.com/banani-generated-images/generated-images/0c71efb7-0092-41d5-a3f4-e4450155e530.jpg'),
  ('Happy Place', 'Emily Henry', 'Two exes must pretend to be a couple at a beach resort in this romantic comedy filled with witty banter.', '2023-06-06', 'https://storage.googleapis.com/banani-generated-images/generated-images/a2727c5f-e372-481d-a0e8-5ba63dfdef0b.jpg'),
  ('Babel', 'R.F. Kuang', 'An alternate history novel set in a version of Oxford where magical translation is the source of power.', '2022-08-30', 'https://storage.googleapis.com/banani-generated-images/generated-images/48a006e9-223c-495f-8f72-9968d0df8216.jpg'),
  ('None of This Is True', 'Lisa Jewell', 'A psychological thriller about a struggling novelist who meets a mysterious woman at a cocktail party.', '2022-05-17', 'https://storage.googleapis.com/banani-generated-images/generated-images/dc1d1c34-e39b-4eb3-80d6-030d12105f2e.jpg'),
  ('Demon Copperhead', 'Barbara Kingsolver', 'A reimagining of David Copperfield set in Appalachia following a boy with a tragic past.', '2022-08-02', 'https://storage.googleapis.com/banani-generated-images/generated-images/47c9689e-8f30-4617-a399-1f1894ec550d.jpg'),
  ('Lessons in Chemistry', 'Bonnie Garmus', 'A historical fiction novel set in the 1960s about a female chemist navigating a male-dominated world.', '2022-03-08', 'https://storage.googleapis.com/banani-generated-images/generated-images/a00aa3f5-cb71-4e96-ba5a-06a924d125e9.jpg'),
  ('The Covenant of Water', 'Abraham Verghese', 'An epic multigenerational novel set in India, following a family across decades.', '2023-10-03', 'https://storage.googleapis.com/banani-generated-images/generated-images/e1d0cd05-522e-450d-b909-783a5d3f02b7.jpg'),
  ('Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', 'A sweeping novel about friendship between two video game designers spanning decades.', '2022-07-05', 'https://storage.googleapis.com/banani-generated-images/generated-images/5bb029c2-b31f-404d-a821-5f61a648e3b3.jpg')
ON CONFLICT DO NOTHING;

-- 3. Add genres (if not exist)
INSERT INTO public.genres (genre_name) 
VALUES ('thriller'), ('mystery'), ('romance'), ('fiction'), ('science-fiction'), ('fantasy'), ('historical-fiction'), ('young-adult'), ('non-fiction'), ('self-help')
ON CONFLICT (genre_name) DO NOTHING;

-- 4. Create a test user (you'll need to replace the UUID with an actual auth user ID from your authentication)
-- Note: This assumes you have created a user in auth.users first
-- The user_id should match an auth.users(id) value

-- 5. Example: Add test user profile
-- This will be created by the auth system, but we can add optional fields
UPDATE public.users 
SET 
  about_me = 'Passionate reader and book lover. Always looking for the next great thriller or mystery!',
  profile_picture_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=readtracker',
  username = 'book_lover_2024',
  birthday = '1995-06-15'::date
WHERE username IS NULL OR username = ''
LIMIT 1;

-- 6. Add a reading goal for the test user
INSERT INTO public.reading_goals (year, target_books, user_id)
SELECT 2026, 50, id FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;

-- Script to seed user_books data with the test user
-- This adds books to the user's reading list with various statuses and ratings
-- Run this after you have a test user UUID from auth.users

-- Example: Insert user books (you'll need to replace USER_ID_UUID with the actual UUID)
-- INSERT INTO public.user_books (user_id, book_id, status_id, rating, note, added_at, read_at)
-- SELECT 
--   (SELECT id FROM auth.users LIMIT 1),
--   book_id,
--   CASE 
--     WHEN book_id IN (1, 2) THEN 1  -- reading
--     WHEN book_id IN (3, 4, 5) THEN 2  -- completed
--     WHEN book_id IN (6, 7, 8) THEN 3  -- want_to_read
--   END,
--   CASE 
--     WHEN book_id IN (3, 4, 5) THEN FLOOR(RANDOM() * 5 + 1)::int
--     ELSE NULL
--   END,
--   'This is a great book!',
--   NOW() - (RANDOM() * 365)::int,
--   CASE WHEN book_id IN (3, 4, 5) THEN NOW() - (RANDOM() * 90)::int ELSE NULL END
-- FROM public.books
-- LIMIT 8;
