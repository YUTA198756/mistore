-- ===================================
-- ミス・トレ（Mistake Treasure）スキーマ
-- Supabase SQL Editor に貼り付けて実行してください
-- ===================================

-- ユーザープロフィール
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  role text not null check (role in ('child', 'parent')),
  current_xp integer default 0,
  created_at timestamptz default now()
);

-- ミス問題（お宝）
create table if not exists mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  image_url text not null,
  status text default 'unresolved' check (status in ('unresolved', 'resolved')),
  handwriting_score integer check (handwriting_score between 0 and 100),
  is_super_gacha boolean default false,
  reflection_text text,
  xp_earned integer default 0,
  created_at timestamptz default now()
);

-- ガチャ状態
create table if not exists gacha_status (
  user_id uuid primary key references profiles(id) on delete cascade,
  last_pulled_date date,
  is_super_gacha boolean default false,
  consecutive_losses integer default 0
);

-- 報酬申請
create table if not exists reward_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  reward_name text not null,
  reward_rank text check (reward_rank in ('S', 'A', 'B')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- ===================================
-- Row Level Security（RLS）は後で設定
-- 開発中はダッシュボードからRLSをオフにしてOK
-- ===================================

-- ===================================
-- Storage バケット作成（SQL Editorでは実行不可）
-- ダッシュボード > Storage > New Bucket で作成：
--   名前: mistake-images
--   Public: ON
-- ===================================
