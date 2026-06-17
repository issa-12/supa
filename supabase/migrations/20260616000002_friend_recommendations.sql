-- =============================================================
-- ReadTrack — Friend book recommendations
-- When a friend recommends a book it is auto-added to the recipient's
-- shelf with the (already-seeded) `recommended_by_friend` status, shown
-- in a "Friends Recommendations" inbox where they accept (→ want_to_read)
-- or decline (→ row deleted).
--
-- This column records WHO recommended it, so the card / book page can show
-- "Recommended by <name>" even after the book moves to another shelf.
-- The cross-user insert is performed by the backend admin client (the
-- user_books RLS INSERT policy only lets a user write their own rows).
-- Accept/decline touch the recipient's own row, already covered by the
-- existing user_books UPDATE/DELETE policies — no RLS change needed.
-- =============================================================

ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS recommended_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
