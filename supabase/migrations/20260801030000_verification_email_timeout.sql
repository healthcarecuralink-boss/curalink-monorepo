-- pg_net's default http_post timeout (5000ms) is too tight for a cold Edge
-- Function start -- verified live: the first real invocation of
-- send-verification-email after deploy took ~4.7s and missed the default
-- window, meaning a real professional's submission could silently go
-- unnotified (net.http_post is fire-and-forget, no retry on timeout).
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
    ),
    timeout_milliseconds := 15000
  );
  return new;
end;
$$;
