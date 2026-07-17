-- Cura Assistant conversation storage (README: "Cura Assistant (AI)" shared
-- utility). This migration builds the full, real conversation history --
-- private to the owning profile -- so the chat UI works end-to-end. The
-- actual LLM call is stubbed in the cura-assistant Edge Function until an
-- Anthropic API key is available (see that function's source for the exact
-- TODO line); this table structure doesn't change when that's plugged in.

create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

alter table public.assistant_conversations enable row level security;
create index assistant_conversations_profile_id_idx on public.assistant_conversations (profile_id);

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.assistant_messages enable row level security;
create index assistant_messages_conversation_id_idx on public.assistant_messages (conversation_id);

create policy "assistant_conversations: self only"
  on public.assistant_conversations for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "assistant_messages: owner of the conversation"
  on public.assistant_messages for all to authenticated
  using (exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.profile_id = auth.uid()))
  with check (exists (select 1 from public.assistant_conversations c where c.id = conversation_id and c.profile_id = auth.uid()));

alter publication supabase_realtime add table public.assistant_messages;
