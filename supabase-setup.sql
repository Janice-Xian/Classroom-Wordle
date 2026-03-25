-- Classroom Wordle Supabase Setup
-- Run this in your Supabase SQL Editor

-- word_banks table
create table if not exists word_banks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  uploader text not null default '匿名老师',
  created_at timestamptz default now()
);

-- words table
create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid references word_banks(id) on delete cascade,
  word text not null,
  hint text,
  letter_count integer not null
);

-- Enable RLS with public access
alter table word_banks enable row level security;
alter table words enable row level security;

-- Word banks policies
create policy "public read" on word_banks for select using (true);
create policy "public insert" on word_banks for insert with check (true);
create policy "public delete" on word_banks for delete using (true);

-- Words policies
create policy "public read" on words for select using (true);
create policy "public insert" on words for insert with check (true);
create policy "public delete" on words for delete using (true);
