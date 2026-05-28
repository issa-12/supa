-- =============================================================
-- Add notification types for comments so the comment-creation flow
-- can notify the post author / parent commenter (parity with likes).
-- =============================================================
INSERT INTO public.notifications_type (notifications_type)
VALUES ('post_commented'), ('comment_replied')
ON CONFLICT DO NOTHING;
