-- Server-side phone OTP store for the WhatsApp Cloud API login flow.
--
-- Unlike the old MSG91 widget (which generated AND verified the OTP itself,
-- client-side), WhatsApp Cloud API only *delivers* a message -- so the backend
-- now owns the whole OTP lifecycle. This table is that state: one live code per
-- phone number, hashed at rest, short-lived, with attempt + resend throttling.
--
-- Only the service role (the send-whatsapp-otp / verify-whatsapp-otp edge
-- functions) ever touches this. RLS is enabled with NO policies, which denies
-- all access to the anon and authenticated roles -- the raw OTP hashes must
-- never be reachable from a client, even a logged-in one.
create table if not exists public.phone_otps (
  -- E.164 without the leading "+" (e.g. "919876543210") -- the same stored
  -- format profiles.phone uses, so the two always join cleanly.
  phone text primary key,
  -- SHA-256 of (pepper || otp), hex. Never store the raw code.
  otp_hash text not null,
  expires_at timestamptz not null,
  -- Wrong-guess counter for the current code; reset on each fresh send.
  attempts integer not null default 0,
  -- Sends within the current rolling window (see window_started_at) -- caps
  -- how many codes a number can request before it has to wait.
  send_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.phone_otps enable row level security;
-- Intentionally no policies -> deny-all for anon/authenticated. Service role
-- bypasses RLS, so the edge functions still have full access.

-- Lets the verify function cheaply skip/expire stale rows.
create index if not exists phone_otps_expires_at_idx on public.phone_otps (expires_at);
