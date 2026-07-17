-- chat_channels / chat_channel_members / chat_messages: care-team, handoff,
-- escalation, ops, and patient-support threads. Visible only to members.
create table public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  type public.chat_channel_type not null,
  booking_id uuid references public.bookings (id),
  created_at timestamptz not null default now()
);

alter table public.chat_channels enable row level security;

create table public.chat_channel_members (
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, profile_id)
);

alter table public.chat_channel_members enable row level security;
create index chat_channel_members_profile_id_idx on public.chat_channel_members (profile_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text,
  attachment_url text,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
create index chat_messages_channel_id_idx on public.chat_messages (channel_id);
