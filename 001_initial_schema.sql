-- DayOff Database Schema
create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  coin_balance int default 100,
  follower_count int default 0,
  following_count int default 0,
  is_live boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  thumbnail_url text,
  caption text,
  like_count int default 0,
  comment_count int default 0,
  view_count int default 0,
  share_count int default 0,
  is_live_recording boolean default false,
  score float default 0,
  created_at timestamptz default now()
);

create table public.stories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  media_url text not null,
  media_type text check (media_type in ('image', 'video')) not null,
  caption text,
  expires_at timestamptz not null,
  view_count int default 0,
  created_at timestamptz default now()
);

create table public.live_rooms (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  livekit_room_name text unique not null,
  status text check (status in ('scheduled', 'live', 'ended')) default 'live',
  viewer_count int default 0,
  peak_viewers int default 0,
  total_gifts int default 0,
  started_at timestamptz default now(),
  ended_at timestamptz,
  vod_url text
);

create table public.live_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.live_rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  content text not null,
  type text default 'text' check (type in ('text', 'gift', 'system')),
  gift_id int,
  created_at timestamptz default now()
);

create table public.gifts (
  id serial primary key,
  name text not null,
  coin_cost int not null,
  animation_url text,
  icon_emoji text
);

insert into public.gifts (name, coin_cost, icon_emoji) values
  ('Rose', 1, '🌹'),
  ('Heart', 5, '❤️'),
  ('Fire', 10, '🔥'),
  ('Galaxy', 50, '🌌'),
  ('Lion', 100, '🦁'),
  ('Rocket', 500, '🚀'),
  ('Crown', 1000, '👑');

create table public.user_gifts (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.live_rooms(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete set null,
  gift_id int references public.gifts(id),
  quantity int default 1,
  coins_spent int not null,
  created_at timestamptz default now()
);

create table public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

create index posts_score_idx on public.posts(score desc, created_at desc);
create index posts_created_at_idx on public.posts(created_at desc);
create index stories_expires_at_idx on public.stories(expires_at);
create index live_rooms_status_idx on public.live_rooms(status);

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.stories enable row level security;
alter table public.live_rooms enable row level security;
alter table public.live_messages enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.user_gifts enable row level security;

create policy "Public profiles viewable" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Posts viewable" on public.posts for select using (true);
create policy "Users insert own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Stories viewable" on public.stories for select using (true);
create policy "Users insert own stories" on public.stories for insert with check (auth.uid() = user_id);
create policy "Live rooms viewable" on public.live_rooms for select using (true);
create policy "Users create own live" on public.live_rooms for insert with check (auth.uid() = host_id);
create policy "Live messages viewable" on public.live_messages for select using (true);
create policy "Auth users send messages" on public.live_messages for insert with check (auth.uid() = user_id);
create policy "Follows viewable" on public.follows for select using (true);
create policy "Users manage own follows" on public.follows for all using (auth.uid() = follower_id);
create policy "Likes viewable" on public.likes for select using (true);
create policy "Users manage own likes" on public.likes for all using (auth.uid() = user_id);
create policy "Comments viewable" on public.comments for select using (true);
create policy "Users insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Gifts viewable" on public.user_gifts for select using (true);
create policy "Auth users send gifts" on public.user_gifts for insert with check (auth.uid() = sender_id);
