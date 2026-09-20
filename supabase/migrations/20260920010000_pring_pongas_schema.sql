create extension if not exists pgcrypto;

create table if not exists public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  player_key text not null unique,
  display_name text not null default 'Jogador',
  xp integer not null default 0 check (xp >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  best_rally integer not null default 0 check (best_rally >= 0),
  favorite_character text,
  favorite_paddle text,
  favorite_table text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  player_key text not null references public.player_profiles(player_key) on delete cascade,
  mode text not null check (mode in ('quick', 'random', 'training')),
  difficulty text not null check (difficulty in ('easy', 'normal', 'hard', 'insane', 'chaotic')),
  table_id text not null,
  player_score integer not null default 0 check (player_score >= 0),
  bot_score integer not null default 0 check (bot_score >= 0),
  best_rally integer not null default 0 check (best_rally >= 0),
  result text not null check (result in ('won', 'lost', 'abandoned')),
  elapsed_seconds numeric(10,2) not null default 0 check (elapsed_seconds >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.match_events (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  event_type text not null check (event_type in ('serve', 'rally', 'point', 'pause', 'resume', 'finish')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists matches_player_key_created_idx on public.matches(player_key, created_at desc);
create index if not exists match_events_match_id_created_idx on public.match_events(match_id, created_at);

create or replace function public.touch_player_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_profiles_updated_at on public.player_profiles;
create trigger player_profiles_updated_at
before update on public.player_profiles
for each row execute function public.touch_player_profiles_updated_at();

alter table public.player_profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;

comment on table public.player_profiles is 'Perfil persistente do jogador Pring Pongas.';
comment on table public.matches is 'Histórico de partidas do MVP 3D.';
comment on table public.match_events is 'Eventos opcionais de uma partida para estatísticas futuras.';
