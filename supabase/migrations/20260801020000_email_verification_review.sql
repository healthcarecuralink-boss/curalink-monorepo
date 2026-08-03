-- Sends a review email to CuraLink staff the moment a professional finishes
-- onboarding (docs + bank details submitted), so verification no longer
-- requires manually running SQL in the dashboard. Reuses the
-- internal_trigger_secret vault secret and net.http_post pattern already
-- established by trigger_push_notification (20260714012000).
--
-- "Signup" itself (request_role, at the very start of onboarding) is too
-- early to notify on -- there are no documents yet at that point. The real
-- submission moment is bank-details.tsx's final `updateProfessionalCredentials`
-- call, which is the last field professional_credentials picks up before the
-- professional lands on /verification-pending -- hence triggering on
-- `bank_details` transitioning from null to non-null below.

create table public.verification_review_tokens (
  token uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  roles text[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz,
  action text check (action in ('approved', 'rejected'))
);

alter table public.verification_review_tokens enable row level security;
-- No policies: only the service-role Edge Functions (which bypass RLS) ever
-- touch this table -- clients have no legitimate reason to read or write
-- review tokens directly.

create or replace function public.notify_verification_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_full_name text;
  v_phone text;
  v_token uuid;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'internal_trigger_secret';
  select full_name, phone into v_full_name, v_phone from public.profiles where id = new.profile_id;

  insert into public.verification_review_tokens (profile_id, roles)
  values (new.profile_id, new.pending_roles)
  returning token into v_token;

  perform net.http_post(
    url := 'https://fsrbfgerimqbzdxspsrf.supabase.co/functions/v1/send-verification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_secret
    ),
    body := jsonb_build_object(
      'token', v_token,
      'profile_id', new.profile_id,
      'full_name', v_full_name,
      'phone', v_phone,
      'roles', new.pending_roles,
      'docs', new.docs
    )
  );
  return new;
end;
$$;

create trigger notify_verification_submitted
  after update of bank_details on public.professional_credentials
  for each row
  when (old.bank_details is null and new.bank_details is not null)
  execute function public.notify_verification_submitted();

-- consume_verification_token: the one-click approve/reject action behind the
-- emailed review link. Deliberately NOT granted to authenticated/anon -- the
-- single-use token itself is the authorization (it was only ever emailed to
-- healthcarecuralink@gmail.com), so only the review-verification Edge
-- Function's service-role client may call this.
create or replace function public.consume_verification_token(p_token uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.verification_review_tokens%rowtype;
begin
  if p_action not in ('approved', 'rejected') then
    raise exception 'invalid action %', p_action;
  end if;

  select * into v_row from public.verification_review_tokens where token = p_token for update;
  if not found then
    raise exception 'invalid token';
  end if;
  if v_row.used_at is not null then
    raise exception 'token already used';
  end if;
  if v_row.expires_at < now() then
    raise exception 'token expired';
  end if;

  update public.verification_review_tokens
  set used_at = now(), action = p_action
  where token = p_token;

  if p_action = 'approved' then
    update public.profiles
    set roles = array(select distinct unnest(roles || v_row.roles))
    where id = v_row.profile_id;

    update public.professional_credentials
    set pending_roles = array(select unnest(pending_roles) except select unnest(v_row.roles)),
        verification_status = 'approved'
    where profile_id = v_row.profile_id;
  else
    update public.professional_credentials
    set pending_roles = array(select unnest(pending_roles) except select unnest(v_row.roles)),
        verification_status = 'rejected'
    where profile_id = v_row.profile_id;
  end if;
end;
$$;
