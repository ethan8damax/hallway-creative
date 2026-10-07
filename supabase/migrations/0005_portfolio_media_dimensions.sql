-- supabase/migrations/0005_portfolio_media_dimensions.sql
--
-- Applied directly via Supabase MCP tooling (project txzlluauftolnuxuvsje).
-- Lets the public category page lay photos out by their real shape
-- (wide images full-bleed, portraits grouped in pairs/threes).

alter table portfolio_media add column width int;
alter table portfolio_media add column height int;
