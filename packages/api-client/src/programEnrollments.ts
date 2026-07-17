import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

type ProgramEnrollment = Database["public"]["Tables"]["program_enrollments"]["Row"];
type ProgramEnrollmentInsert = Database["public"]["Tables"]["program_enrollments"]["Insert"];

export async function fetchMyEnrollments(consumerId: string): Promise<ProgramEnrollment[]> {
  const { data, error } = await supabase
    .from("program_enrollments")
    .select("*")
    .eq("consumer_id", consumerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createEnrollment(enrollment: ProgramEnrollmentInsert): Promise<ProgramEnrollment> {
  const { data, error } = await supabase.from("program_enrollments").insert(enrollment).select().single();
  if (error) throw error;
  return data;
}
