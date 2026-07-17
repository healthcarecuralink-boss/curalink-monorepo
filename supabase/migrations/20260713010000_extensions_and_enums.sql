-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.booking_status as enum ('pending', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.pharmacy_order_status as enum ('placed', 'preparing', 'ready', 'picked_up', 'completed', 'cancelled');
create type public.ambulance_type as enum ('BLS', 'ALS');
create type public.ambulance_status as enum ('requested', 'accepted', 'en_route', 'arrived', 'transporting', 'completed', 'cancelled');
create type public.payout_method_type as enum ('bank', 'upi');
create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed');
create type public.chat_channel_type as enum ('care_team', 'handoff', 'escalation', 'ops', 'patient_support');
create type public.team_member_status as enum ('active', 'inactive', 'suspended');
