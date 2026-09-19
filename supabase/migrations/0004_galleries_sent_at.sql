-- supabase/migrations/0004_galleries_sent_at.sql
--
-- Applied directly via Supabase MCP tooling (project txzlluauftolnuxuvsje).
-- Tracks whether/when the "send to client" email went out, so the admin UI
-- can show "already sent" instead of relying solely on transient client
-- state to guard against an accidental duplicate send.

alter table galleries add column sent_at timestamptz;
