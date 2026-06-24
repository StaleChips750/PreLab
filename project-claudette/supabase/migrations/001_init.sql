-- Enable pgvector
create extension if not exists vector;

-- Users table: one row per Instagram user who has DMed Claudette
create table users (
  id uuid primary key default gen_random_uuid(),
  instagram_user_id text unique not null,
  display_name text,
  first_seen_at timestamptz default now(),
  last_active_at timestamptz default now(),
  notes text  -- Claudette's running soft profile of this user
);

-- Messages table: full message log per user
create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Semantic memory table: long-term vector embeddings per user
create table memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  summary text not null,
  embedding vector(1536),  -- text-embedding-3-small dimension
  created_at timestamptz default now()
);

-- Index for fast vector similarity search
create index on memories using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Helpful supporting indexes for the per-user fetch patterns used by the app
create index if not exists messages_user_created_idx
  on messages (user_id, created_at desc);
create index if not exists memories_user_idx
  on memories (user_id);

-- Stored procedure: cosine-similarity search scoped to a single user.
-- Called from src/memory/semantic.js via supabase.rpc('match_memories', ...).
create or replace function match_memories(
  p_user_id uuid,
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  summary text,
  similarity float
)
language sql stable
as $$
  select
    m.id,
    m.summary,
    1 - (m.embedding <=> query_embedding) as similarity
  from memories m
  where m.user_id = p_user_id
  order by m.embedding <=> query_embedding
  limit match_count;
$$;
