-- README: Ambulance Partner "Vehicle & crew" screen. Neither jsonb column on
-- professional_credentials fits: `credentials` is an array of onboarding
-- qualification entries (see professional-details-1.tsx) and `docs` is an
-- array of document-upload entries -- both have an established shape already
-- read elsewhere. Vehicle/crew is public-facing operational data about the
-- ambulance itself, closer in kind to professional_profiles' other
-- role-specific fields (bio, service_area) than to onboarding paperwork.
alter table public.professional_profiles add column vehicle_info jsonb not null default '{}'::jsonb;

grant update (vehicle_info) on public.professional_profiles to authenticated;
