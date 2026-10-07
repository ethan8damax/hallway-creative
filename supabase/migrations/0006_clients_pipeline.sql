-- supabase/migrations/0006_clients_pipeline.sql
--
-- Applied directly via Supabase MCP tooling (project txzlluauftolnuxuvsje).
-- Client pipeline (inquiry → posted), an activity log per client, and
-- gallery delivery tracking (expiry, first view, download).

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  event_type text,
  event_date date,
  event_location text,
  stage text not null default 'inquiry'
    check (stage in ('inquiry', 'conversation', 'contract', 'event', 'red_room', 'posted', 'archived')),
  -- true until Andrew first opens the client; drives the "New" badge
  is_new boolean not null default true,
  inquiry_message text,
  contract_url text,
  contract_signed_on date,
  created_at timestamptz not null default now(),
  stage_changed_at timestamptz not null default now()
);
create index clients_stage_idx on clients (stage, stage_changed_at desc);

create table client_activity (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null check (kind in ('note', 'stage', 'inquiry', 'gallery')),
  body text not null,
  created_at timestamptz not null default now()
);
create index client_activity_client_idx on client_activity (client_id, created_at desc);

alter table galleries add column client_id uuid references clients(id) on delete set null;
create index galleries_client_idx on galleries (client_id);
alter table galleries add column expires_on date;
alter table galleries add column first_viewed_at timestamptz;
alter table galleries add column downloaded_at timestamptz;

-- Same model as galleries/photos: RLS on, zero policies, so the public API can
-- never touch client data; every access goes through server-only service-role code.
alter table clients enable row level security;
alter table client_activity enable row level security;
