-- supabase/migrations/0001_portfolio_content.sql

create table categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  sort_order int not null default 0
);

create table portfolio_media (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  r2_key text,
  image_url text,
  preview_url text,
  video_url text,
  caption text,
  sort_order int not null default 0
);

create table services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category_id uuid references categories(id) on delete set null,
  sort_order int not null default 0
);

create table about (
  id uuid primary key default gen_random_uuid(),
  bio text,
  portrait_r2_key text,
  portrait_url text
);

create table site_settings (
  id uuid primary key default gen_random_uuid(),
  hero_headline text,
  hero_subtext text,
  contact_email text,
  instagram_url text
);

-- `about` and `site_settings` are single-row tables. Seed the one row each
-- now so the app never has to handle "no row exists yet".
insert into about (bio) values (null);
insert into site_settings (hero_headline, contact_email) values ('HallWay Creative', 'hallway.ah@gmail.com');

-- Public read on all portfolio content; writes only via the service-role
-- client from server-only admin code (see lib/supabase/service.ts) — no
-- anon write policy is created, so the public API can never mutate these.
alter table categories enable row level security;
alter table portfolio_media enable row level security;
alter table services enable row level security;
alter table about enable row level security;
alter table site_settings enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read portfolio_media" on portfolio_media for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read about" on about for select using (true);
create policy "public read site_settings" on site_settings for select using (true);
