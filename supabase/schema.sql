-- ==========================================
-- NexInc Database Schema Setup
-- ==========================================

-- ------------------------------------------
-- 1. Profiles Table
-- ------------------------------------------
-- Stores user profiles extending Supabase auth.users.
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  avatar_url text,
  plan text not null default 'free',
  plan_renews_at timestamptz,
  created_at timestamptz default now(),
  
  -- Ensure plan is either 'free' or 'ultimate'
  constraint check_plan check (plan in ('free', 'ultimate'))
);

-- ------------------------------------------
-- 2. Trigger: Auto-create Profile on Signup
-- ------------------------------------------
-- Automatically copy user details from the private auth.users table
-- to our public.profiles table upon registration.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url, plan)
  values (
    new.id,
    -- Try getting the full_name, fall back to email name prefix if missing
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'free'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------
-- 3. Chat Sessions Table
-- ------------------------------------------
-- Represents distinct chat sessions organized in sections.
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'New chat',
  section text not null default 'chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Restrict sections to specific application pages
  constraint check_section check (section in ('chat', 'code', 'learning', 'research'))
);

-- ------------------------------------------
-- 4. Messages Table
-- ------------------------------------------
-- Stores dialog messages sent within chat sessions.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null,
  content text not null,
  model_used text,
  created_at timestamptz default now(),

  -- Ensure role is either user or assistant
  constraint check_role check (role in ('user', 'assistant'))
);

-- ------------------------------------------
-- 5. Row Level Security (RLS) Setup
-- ------------------------------------------
-- Enable security controls to prevent unauthorized access.
alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;

-- PROFILES POLICIES
-- Users can view their own profile details
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

-- Users can edit their own profile details (like changing names)
create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Users can insert their own profile details (system handles this via triggers, but allowed for redundancy)
create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Note: Profiles cannot be deleted directly by the user (No DELETE policy)

-- CHAT SESSIONS POLICIES
-- Users can view, create, edit, and delete their own chat sessions
create policy "Users can select own chat sessions" 
  on public.chat_sessions for select 
  using (auth.uid() = user_id);

create policy "Users can insert own chat sessions" 
  on public.chat_sessions for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own chat sessions" 
  on public.chat_sessions for update 
  using (auth.uid() = user_id);

create policy "Users can delete own chat sessions" 
  on public.chat_sessions for delete 
  using (auth.uid() = user_id);

-- MESSAGES POLICIES
-- Users can view, create, edit, and delete messages belonging to their account
create policy "Users can select own messages" 
  on public.messages for select 
  using (auth.uid() = user_id);

create policy "Users can insert own messages" 
  on public.messages for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own messages" 
  on public.messages for update 
  using (auth.uid() = user_id);

create policy "Users can delete own messages" 
  on public.messages for delete 
  using (auth.uid() = user_id);

-- ------------------------------------------
-- 6. Indexes for Performance
-- ------------------------------------------
-- Add indexes on foreign keys that are frequently queried or joined.
create index idx_chat_sessions_user_id on public.chat_sessions(user_id);
create index idx_messages_session_id on public.messages(session_id);
