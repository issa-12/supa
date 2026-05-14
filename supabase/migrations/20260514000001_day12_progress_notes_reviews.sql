-- Day 12: Reading progress, private notes, and public reviews

-- Add progress + review columns to user_books
ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS current_page INT,
  ADD COLUMN IF NOT EXISTS total_pages  INT,
  ADD COLUMN IF NOT EXISTS note         TEXT,
  ADD COLUMN IF NOT EXISTS review_text  TEXT;
