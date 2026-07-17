import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";

export type JobType = "booking" | "ambulance_request";
type ProviderLocation = Database["public"]["Tables"]["provider_locations"]["Row"];

// Upserted continuously by the assigned professional while a job is
// en-route/transporting (README: the real GPS stream CuraLink's live-
// tracking map subscribes to). One row per job (job_type, job_id) --
// RLS only allows the assigned professional to write, and only for jobs
// can_view_job_location() confirms they're actually assigned to.
export async function publishProviderLocation(
  jobType: JobType,
  jobId: string,
  professionalId: string,
  lat: number,
  lng: number,
  heading?: number | null,
): Promise<void> {
  const { error } = await supabase
    .from("provider_locations")
    .upsert(
      { job_type: jobType, job_id: jobId, professional_id: professionalId, lat, lng, heading: heading ?? null, recorded_at: new Date().toISOString() },
      { onConflict: "job_type,job_id" },
    );
  if (error) throw error;
}

export async function fetchProviderLocation(jobType: JobType, jobId: string): Promise<ProviderLocation | null> {
  const { data, error } = await supabase
    .from("provider_locations")
    .select("*")
    .eq("job_type", jobType)
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Batch variant for the admin dispatch map -- one query for every active
// job's latest known position, instead of one round trip per job.
export async function fetchProviderLocationsForJobs(jobType: JobType, jobIds: string[]): Promise<ProviderLocation[]> {
  if (jobIds.length === 0) return [];
  const { data, error } = await supabase.from("provider_locations").select("*").eq("job_type", jobType).in("job_id", jobIds);
  if (error) throw error;
  return data;
}

// Realtime channel for one job's GPS stream -- caller unsubscribes on
// unmount (same pattern as subscribeToChannelMessages for chat). Realtime's
// postgres_changes filter only supports a single column condition, so
// job_type is double-checked client-side (job_id alone is effectively
// unique in practice, but the composite key is (job_type, job_id)).
export function subscribeToProviderLocation(
  jobType: JobType,
  jobId: string,
  onUpdate: (location: ProviderLocation) => void,
) {
  return supabase
    .channel(`provider_locations:${jobType}:${jobId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "provider_locations", filter: `job_id=eq.${jobId}` },
      (payload) => {
        const location = payload.new as ProviderLocation;
        if (location.job_type === jobType) onUpdate(location);
      },
    )
    .subscribe();
}
