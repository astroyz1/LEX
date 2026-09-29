create type public.professional_type as enum ('student','advocate','researcher','firm');
create type public.post_category as enum ('general','question','legal_update','opportunity');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  professional_type public.professional_type,
  organization text,
  interests text[] not null default '{}',
  bio text,
  verified boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.profiles to authenticated;
grant insert (id, full_name, professional_type, organization, interests, bio, onboarded) on public.profiles to authenticated;
grant update (full_name, professional_type, organization, interests, bio, onboarded) on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category public.post_category not null default 'general',
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 5000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts readable" on public.posts for select to authenticated using (true);
create policy "posts insert own" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "posts update own" on public.posts for update to authenticated using (auth.uid() = author_id);
create policy "posts delete own" on public.posts for delete to authenticated using (auth.uid() = author_id);

create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.post_reposts (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);
grant select, insert, delete on public.post_likes, public.post_reposts, public.follows to authenticated;
grant select, insert, update, delete on public.post_comments to authenticated;
grant all on public.post_likes, public.post_reposts, public.follows, public.post_comments to service_role;
alter table public.post_likes enable row level security;
alter table public.post_reposts enable row level security;
alter table public.post_comments enable row level security;
alter table public.follows enable row level security;
create policy "likes read" on public.post_likes for select to authenticated using (true);
create policy "likes own ins" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes own del" on public.post_likes for delete to authenticated using (auth.uid() = user_id);
create policy "reposts read" on public.post_reposts for select to authenticated using (true);
create policy "reposts own ins" on public.post_reposts for insert to authenticated with check (auth.uid() = user_id);
create policy "reposts own del" on public.post_reposts for delete to authenticated using (auth.uid() = user_id);
create policy "comments read" on public.post_comments for select to authenticated using (true);
create policy "comments own ins" on public.post_comments for insert to authenticated with check (auth.uid() = author_id);
create policy "comments own del" on public.post_comments for delete to authenticated using (auth.uid() = author_id);
create policy "follows read" on public.follows for select to authenticated using (true);
create policy "follows own ins" on public.follows for insert to authenticated with check (auth.uid() = follower_id and follower_id <> following_id);
create policy "follows own del" on public.follows for delete to authenticated using (auth.uid() = follower_id);