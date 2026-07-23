-- One-time bootstrap for the first CuraLink-staff account, same pattern as
-- the existing admin bootstrap in seed.sql -- there is deliberately no
-- self-service path to this flag (see is_curalink_staff() and its RLS
-- policies in the partner_invitations_and_staff_verification migration).
do $$
declare
  affected int;
begin
  update public.profiles set is_curalink_staff = true where email = 'healthcarecuralink@gmail.com';
  get diagnostics affected = row_count;
  if affected = 0 then
    raise exception 'No profile found with email healthcarecuralink@gmail.com -- sign in at least once first, then re-run this migration';
  end if;
end $$;
