import type { Database, ProfessionalRole } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfessionalProfile = Database["public"]["Tables"]["professional_profiles"]["Row"];

export type { ProfessionalRole };

export const PROFESSIONAL_ROLES: ProfessionalRole[] = [
  "nurse",
  "doctor",
  "vet",
  "pharmacy",
  "ambulance",
  "admin",
];

export function isProfessionalRole(value: string): value is ProfessionalRole {
  return (PROFESSIONAL_ROLES as string[]).includes(value);
}
