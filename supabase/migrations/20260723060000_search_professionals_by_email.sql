-- Lets a partner admin's search also match by email, not just name/phone.
create or replace function public.search_verified_professionals(p_query text, p_role text default null)
returns table (id uuid, full_name text, phone text, roles text[])
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.phone, p.roles
  from public.profiles p
  where public.has_role('admin')
    and length(p_query) >= 3
    and (p_role is null or p_role = any(p.roles))
    and (
      p.full_name ilike '%' || p_query || '%'
      or p.phone = p_query
      or p.email ilike '%' || p_query || '%'
    )
  limit 20;
$$;
