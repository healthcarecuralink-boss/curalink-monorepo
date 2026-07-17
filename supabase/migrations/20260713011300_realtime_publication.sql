-- Tables the two apps subscribe to live: booking/visit status, the provider
-- GPS stream, ambulance + pharmacy status, chat, and notifications.
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.provider_locations;
alter publication supabase_realtime add table public.ambulance_requests;
alter publication supabase_realtime add table public.pharmacy_orders;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.notifications;
