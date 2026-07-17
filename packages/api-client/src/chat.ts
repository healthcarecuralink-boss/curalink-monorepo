import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type ChatChannel = Database["public"]["Tables"]["chat_channels"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export interface MyChannel {
  channel: ChatChannel;
  label: string;
}

// Channels the profile belongs to (used for the "Team chat" list on Profile).
export async function fetchMyChannels(profileId: string): Promise<MyChannel[]> {
  const { data: memberships, error } = await supabase
    .from("chat_channel_members")
    .select("channel_id")
    .eq("profile_id", profileId);
  if (error) throw error;
  if (memberships.length === 0) return [];

  const { data: channels, error: channelsError } = await supabase
    .from("chat_channels")
    .select("*")
    .in(
      "id",
      memberships.map((m) => m.channel_id),
    )
    .order("created_at", { ascending: false });
  if (channelsError) throw channelsError;

  const bookingIds = [...new Set(channels.map((c) => c.booking_id).filter((id): id is string => id !== null))];
  const { data: bookings } =
    bookingIds.length > 0
      ? await supabase.from("bookings").select("id, service_id").in("id", bookingIds)
      : { data: [] as { id: string; service_id: string }[] };
  const serviceIds = [...new Set((bookings ?? []).map((b) => b.service_id))];
  const { data: services } =
    serviceIds.length > 0
      ? await supabase.from("services").select("id, name").in("id", serviceIds)
      : { data: [] as { id: string; name: string }[] };

  return channels.map((channel) => {
    const booking = bookings?.find((b) => b.id === channel.booking_id);
    const service = booking ? services?.find((s) => s.id === booking.service_id) : null;
    return {
      channel,
      label: channel.type === "ops" ? "Ops support" : (service?.name ?? "Care team"),
    };
  });
}

// One channel per booking for the assigned professional + their admin to
// coordinate on that patient's care (README: nurse/vet/doctor "Team chat").
// Created lazily the first time someone opens it for a given job.
export async function fetchOrCreateCareTeamChannel(bookingId: string, professionalId: string): Promise<ChatChannel> {
  const { data: existing, error } = await supabase
    .from("chat_channels")
    .select("*")
    .eq("booking_id", bookingId)
    .eq("type", "care_team")
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: adminId } = await supabase.rpc("team_admin_of", { p_professional_id: professionalId });
  const { data: created, error: createError } = await supabase.rpc("create_chat_channel", {
    p_type: "care_team",
    p_booking_id: bookingId,
    p_extra_member_id: adminId,
  });
  if (createError) throw createError;
  return created;
}

// The SOS button's target channel: an "escalation" thread between the
// professional and their team admin, scoped to whatever job they're on (if
// any). Reuses team_admin_of() the same way fetchOrCreateCareTeamChannel does.
// With no active booking, falls back to the professional's own standalone
// escalation channel (scoped by membership, like fetchOrCreateOpsChannel --
// booking_id is null for every professional's standalone channel, so a plain
// `.is("booking_id", null)` lookup would leak into other people's threads).
export async function fetchOrCreateEscalationChannel(professionalId: string, bookingId: string | null): Promise<ChatChannel> {
  if (bookingId) {
    const { data: existing, error } = await supabase
      .from("chat_channels")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("type", "escalation")
      .maybeSingle();
    if (error) throw error;
    if (existing) return existing;
  } else {
    const { data: memberships, error: membershipsError } = await supabase
      .from("chat_channel_members")
      .select("channel_id")
      .eq("profile_id", professionalId);
    if (membershipsError) throw membershipsError;

    if (memberships.length > 0) {
      const { data: existing, error } = await supabase
        .from("chat_channels")
        .select("*")
        .in(
          "id",
          memberships.map((m) => m.channel_id),
        )
        .eq("type", "escalation")
        .is("booking_id", null)
        .maybeSingle();
      if (error) throw error;
      if (existing) return existing;
    }
  }

  const { data: adminId } = await supabase.rpc("team_admin_of", { p_professional_id: professionalId });
  const { data: created, error: createError } = await supabase.rpc("create_chat_channel", {
    p_type: "escalation",
    p_booking_id: bookingId,
    p_extra_member_id: adminId,
  });
  if (createError) throw createError;
  return created;
}

// A private, per-professional thread to CuraLink ops (README: shared utility
// "Ops support chat"). No real ops-staff account is modeled yet, so this is
// just the professional's own persistent thread.
export async function fetchOrCreateOpsChannel(profileId: string): Promise<ChatChannel> {
  const { data: memberships, error } = await supabase
    .from("chat_channel_members")
    .select("channel_id")
    .eq("profile_id", profileId);
  if (error) throw error;

  if (memberships.length > 0) {
    const { data: opsChannel, error: opsError } = await supabase
      .from("chat_channels")
      .select("*")
      .in(
        "id",
        memberships.map((m) => m.channel_id),
      )
      .eq("type", "ops")
      .maybeSingle();
    if (opsError) throw opsError;
    if (opsChannel) return opsChannel;
  }

  const { data: created, error: createError } = await supabase.rpc("create_chat_channel", {
    p_type: "ops",
    p_booking_id: null,
  });
  if (createError) throw createError;
  return created;
}

export async function fetchMessages(channelId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function sendMessage(channelId: string, senderId: string, body: string): Promise<void> {
  const { error } = await supabase.from("chat_messages").insert({ channel_id: channelId, sender_id: senderId, body });
  if (error) throw error;
}

// Returns the realtime channel so the caller can unsubscribe (e.g. in a
// useEffect cleanup) -- Postgres Changes on chat_messages, scoped to one room.
export function subscribeToChannelMessages(channelId: string, onInsert: (message: ChatMessage) => void) {
  return supabase
    .channel(`chat_messages:${channelId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
      (payload) => onInsert(payload.new as ChatMessage),
    )
    .subscribe();
}
