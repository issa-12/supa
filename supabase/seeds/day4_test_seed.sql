-- =============================================================
-- ReadTrack — Day 4 Test Seed
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor)
-- Creates 3 dummy users so you can test the full friend flow.
-- =============================================================

-- Step 1: Insert dummy users into auth.users
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'alice@readtrack.test',
    '',
    now(),
    '{"name": "Alice Reader"}',
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'bob@readtrack.test',
    '',
    now(),
    '{"name": "Bob Bookworm"}',
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'carol@readtrack.test',
    '',
    now(),
    '{"name": "Carol Pages"}',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Step 2: Mirror them into public.users
INSERT INTO public.users (id, email, name, created_at, updated_at)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'alice@readtrack.test',
    'Alice Reader',
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'bob@readtrack.test',
    'Bob Bookworm',
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'carol@readtrack.test',
    'Carol Pages',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create a friendship between Alice and Bob (accepted)
-- so you can see the "Friends" state in the UI
INSERT INTO public.friendship (user_id1, user_id2, status_id, requester_id)
SELECT
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  fs.status_id,
  'aaaaaaaa-0000-0000-0000-000000000001'
FROM public.friendship_status fs
WHERE fs.status_name = 'accepted'
ON CONFLICT DO NOTHING;

-- Done.
-- Alice: aaaaaaaa-0000-0000-0000-000000000001  →  /profile/aaaaaaaa-0000-0000-0000-000000000001
-- Bob:   aaaaaaaa-0000-0000-0000-000000000002  →  /profile/aaaaaaaa-0000-0000-0000-000000000002
-- Carol: aaaaaaaa-0000-0000-0000-000000000003  →  /profile/aaaaaaaa-0000-0000-0000-000000000003
