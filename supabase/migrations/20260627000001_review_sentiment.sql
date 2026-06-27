-- Add sentiment column to user_books for review text analysis.
-- Populated by the backend PATCH /api/books/review endpoint when a review is saved.
ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS review_sentiment TEXT;
