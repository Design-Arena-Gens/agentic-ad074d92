# Agentic Browser Assistant

Supabase-backed Next.js application that ingests Chrome pages, distills the important context, and turns the resulting insights into a sequenced execution plan.

## Features

- Page ingestion via live URL or pasted HTML, parsed with `jsdom` + `@mozilla/readability`
- Insight panel highlighting summaries, headings, and actionable calls-to-action
- Task board connected to Supabase for durable tracking, including prioritisation & status
- Tailwind-driven layout ready for deployment on Vercel

## Stack

- Next.js 14 (App Router, TypeScript)
- React 18 with client components
- Tailwind CSS 3
- Supabase (`@supabase/supabase-js`) + optional service role persistence
- Node.js 18+

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

## Supabase Schema

Run the SQL in `supabase/schema.sql` or sync with the SQL editor:

```sql
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'backlog',
  priority text not null default 'medium',
  page_url text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table public.page_captures (
  id uuid primary key default gen_random_uuid(),
  url text,
  html text,
  insight jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- remember to enable Row Level Security and add service role policies
```

Assign these environment variables before running or deploying:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Without the service role key the API routes skip persistence, so the UI will still ingest pages but tasks will not be stored.

## Available Scripts

- `npm run dev` – Next.js dev server with HMR
- `npm run lint` – ESLint via `next lint`
- `npm run build` – Production build, type-check, and lint
- `npm run start` – Start production server (after build)

## Deployment

The project is optimised for Vercel (`vercel build` compatible). Remember to configure the same Supabase environment variables in the Vercel dashboard or `vercel env`.
