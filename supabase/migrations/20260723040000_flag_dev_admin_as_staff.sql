-- Dev/QA convenience: the seeded "Test Admin" account (see seed.sql,
-- phone 1234500003) is also flagged as curalink_staff so the dev-only sign-in
-- shortcut in curalink-team's login screen can exercise the verification
-- queue without a real staff Google/email account. is_curalink_staff is
-- independent of profiles.roles, so this doesn't change what the account can
-- do as a Partner Admin.
do $$
declare
  affected int;
begin
  update public.profiles set is_curalink_staff = true where phone = '911234500003';
  get diagnostics affected = row_count;
  if affected = 0 then
    raise notice 'No profile found with phone 1234500003 -- skipping (seed.sql may not have been run against this project)';
  end if;
end $$;
