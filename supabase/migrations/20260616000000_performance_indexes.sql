-- =============================================================
-- ReadTrack — Performance indexes
-- Adds composite + targeted indexes for hot query paths that
-- previously fell back to full-table scans or multi-index bitmaps.
-- =============================================================

-- Shelf lookups filter on (user_id, status_id) together:
-- getContinueReadingBooks, getUserBooksByStatus, getUserReadingStats,
-- StatsService.getReadingPace. A composite index serves these directly.
CREATE INDEX IF NOT EXISTS idx_user_books_user_status
  ON public.user_books(user_id, status_id);

-- Stats period filters (getTopBooks) and "read this year" checks use
-- range scans on updated_at.
CREATE INDEX IF NOT EXISTS idx_user_books_updated_at
  ON public.user_books(updated_at DESC);

-- PresenceService.loadPresenceForUser filters last_seen_at >= cutoff.
-- Partial index keeps it small (only users who have ever been seen).
CREATE INDEX IF NOT EXISTS idx_users_last_seen
  ON public.users(last_seen_at DESC)
  WHERE last_seen_at IS NOT NULL;
