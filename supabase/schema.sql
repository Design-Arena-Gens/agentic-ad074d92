create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'backlog' check (status in ('backlog', 'in_progress', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  page_url text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.page_captures (
  id uuid primary key default gen_random_uuid(),
  url text,
  html text,
  insight jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.tasks enable row level security;
alter table public.page_captures enable row level security;

create policy "Service role full access" on public.tasks
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role full access" on public.page_captures
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
