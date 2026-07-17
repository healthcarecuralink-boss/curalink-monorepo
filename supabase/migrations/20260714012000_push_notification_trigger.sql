-- Wires every `notifications` insert to actually attempt a push send, via
-- the send-push-notification Edge Function (see that function's source --
-- the FCM call itself is stubbed there until a Firebase key exists, but this
-- trigger, the HTTP dispatch, and the preference/token lookups are all real).
create extension if not exists pg_net;

-- Shared secret so the Edge Function can trust that a call genuinely came
-- from this trigger (mirrors send-sms-hook's signature-verification
-- reasoning, just via a static header instead of a signed webhook, since
-- Postgres is the caller here, not a third party). Stored in Supabase Vault
-- since this database role can't set a custom app.settings GUC directly.
-- The exact same value must be set as the INTERNAL_TRIGGER_SECRET function
-- secret (`supabase secrets set INTERNAL_TRIGGER_SECRET=...`).
select vault.create_secret(
  '3b2df083d4c268b0a625ad94f76529e77296fb4d3be90ac958694a5a5cb4811a',
  'internal_trigger_secret',
  'Shared secret so send-push-notification trusts calls from trigger_push_notification'
);

create or replace function public.trigger_push_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'internal_trigger_secret';

  perform net.http_post(
    url := 'https://fsrbfgerimqbzdxspsrf.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_secret
    ),
    body := jsonb_build_object(
      'profile_id', new.profile_id,
      'type', new.type,
      'title', new.title,
      'body', new.body,
      'data', new.data
    )
  );
  return new;
end;
$$;

create trigger trigger_push_notification
  after insert on public.notifications
  for each row execute function public.trigger_push_notification();
