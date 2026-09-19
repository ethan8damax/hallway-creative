-- supabase/migrations/0002_galleries.sql

create table galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text not null,
  slug text unique not null,
  event_date date,
  access_code_hash text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references galleries(id) on delete cascade,
  r2_key text not null,
  url text not null,
  preview_url text not null,
  width int,
  height int,
  filename text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- No public policies at all: RLS is enabled with zero select/insert/update/delete
-- policies for the anon role, so the public Supabase API can never read or write
-- these tables under any circumstance. Every access — admin mutations, and the
-- gallery page's read after a verified access code — goes through server-only
-- code using the service-role client (lib/supabase/service.ts), which bypasses
-- RLS entirely. This is a stronger guarantee than a permissive-looking policy.
alter table galleries enable row level security;
alter table photos enable row level security;
