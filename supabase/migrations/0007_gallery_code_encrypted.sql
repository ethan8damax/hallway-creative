-- supabase/migrations/0007_gallery_code_encrypted.sql
--
-- Applied directly via Supabase MCP tooling (project txzlluauftolnuxuvsje).
-- Encrypted copy of the access code (see lib/codeCrypto.ts) so admin can show
-- it; verification still uses access_code_hash.

alter table galleries add column access_code_encrypted text;
