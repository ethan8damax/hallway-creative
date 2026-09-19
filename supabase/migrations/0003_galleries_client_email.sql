-- supabase/migrations/0003_galleries_client_email.sql
--
-- Applied directly via Supabase MCP tooling (project txzlluauftolnuxuvsje).
-- Needed by the send-to-client email route, which sends to this address.

alter table galleries add column client_email text not null default '';
