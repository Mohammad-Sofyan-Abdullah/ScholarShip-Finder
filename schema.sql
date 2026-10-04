-- ScholarShip Helper — run once in Supabase SQL Editor (Project > SQL Editor > New query > Run)

create extension if not exists pgcrypto;

create table if not exists profile (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  university text,
  degree text,
  cgpa numeric,
  graduation_date date,
  target_degree text default 'Masters',
  target_fields text[] default '{}',
  target_countries text[] default '{}',
  english_test text,
  notes text,
  updated_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  doc_type text not null default 'other', -- cv, sop, transcript, lor, test_score, other
  storage_path text not null,
  version int default 1,
  uploaded_at timestamptz default now(),
  notes text
);

create table if not exists scholarships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  university text,
  country text,
  field_tags text[] default '{}',
  degree_level text default 'Masters',
  funding_type text,             -- full, partial, tuition-only, stipend-only
  application_fee text,          -- 'none', 'waived', or an amount
  deadline date,
  deadline_notes text,           -- e.g. "varies by region", "rolling"
  application_link text,
  source_url text,
  status text default 'found',   -- found, shortlisted, applying, applied, interview, accepted, rejected, expired
  priority text default 'medium',-- high, medium, low
  discovered_at timestamptz default now(),
  last_checked timestamptz default now(),
  notes text,
  unique (name, university, deadline)
);

create index if not exists idx_scholarships_deadline on scholarships(deadline);
create index if not exists idx_scholarships_status on scholarships(status);

alter table profile enable row level security;
alter table documents enable row level security;
alter table scholarships enable row level security;
-- No policies added on purpose: only the service_role / secret key (used server-side by
-- the scripts in this project) can read/write. The anon key has zero access.
