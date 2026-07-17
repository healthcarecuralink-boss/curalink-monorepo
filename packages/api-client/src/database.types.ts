// Hand-written to mirror supabase/migrations/*.sql exactly (schema introspection
// via `supabase gen types` needs Docker/podman to run postgres-meta locally,
// which this environment doesn't have). Keep this in sync with the migrations
// when the schema changes -- shape matches what `supabase gen types` would
// produce, so it can be swapped for a generated file later without churn
// elsewhere in the codebase.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VerificationStatus = "pending" | "approved" | "rejected";
export type BookingStatus = "pending" | "confirmed" | "en_route" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PharmacyOrderStatus = "placed" | "preparing" | "ready" | "picked_up" | "completed" | "cancelled";
export type AmbulanceType = "BLS" | "ALS";
export type AmbulanceStatus =
  | "requested"
  | "accepted"
  | "en_route"
  | "arrived"
  | "transporting"
  | "completed"
  | "cancelled";
export type PayoutMethodType = "bank" | "upi";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed";
export type ChatChannelType = "care_team" | "handoff" | "escalation" | "ops" | "patient_support";
export type TeamMemberStatus = "active" | "inactive" | "suspended";
export type ProfessionalRole = "nurse" | "doctor" | "vet" | "pharmacy" | "ambulance" | "admin";
export type TimeOffStatus = "requested" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string | null;
          full_name: string;
          email: string | null;
          avatar_url: string | null;
          roles: string[];
          referral_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          full_name: string;
          email?: string | null;
          avatar_url?: string | null;
          roles?: string[];
          referral_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      professional_profiles: {
        Row: {
          profile_id: string;
          bio: string | null;
          years_experience: number | null;
          is_on_duty: boolean;
          availability: Json;
          rating: number;
          rating_count: number;
          service_area: string | null;
          lat: number | null;
          lng: number | null;
          vehicle_info: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          bio?: string | null;
          years_experience?: number | null;
          is_on_duty?: boolean;
          availability?: Json;
          rating?: number;
          rating_count?: number;
          service_area?: string | null;
          lat?: number | null;
          lng?: number | null;
          vehicle_info?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["professional_profiles"]["Insert"]>;
        Relationships: [];
      };
      professional_credentials: {
        Row: {
          profile_id: string;
          credentials: Json;
          docs: Json;
          bank_details: Json | null;
          verification_status: VerificationStatus;
          pending_roles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          credentials?: Json;
          docs?: Json;
          bank_details?: Json | null;
          verification_status?: VerificationStatus;
          pending_roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["professional_credentials"]["Insert"]>;
        Relationships: [];
      };
      teams: {
        Row: { id: string; admin_id: string; name: string; created_at: string };
        Insert: { id?: string; admin_id: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          professional_id: string;
          role: string;
          status: TeamMemberStatus;
          docs_ok: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          professional_id: string;
          role: string;
          status?: TeamMemberStatus;
          docs_ok?: boolean;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
        Relationships: [];
      };
      payout_methods: {
        Row: {
          id: string;
          professional_id: string;
          method: PayoutMethodType;
          details: Json;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          method: PayoutMethodType;
          details: Json;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payout_methods"]["Insert"]>;
        Relationships: [];
      };
      payout_records: {
        Row: {
          id: string;
          professional_id: string;
          payout_method_id: string | null;
          amount: number;
          status: PayoutStatus;
          period_start: string | null;
          period_end: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          payout_method_id?: string | null;
          amount: number;
          status?: PayoutStatus;
          period_start?: string | null;
          period_end?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payout_records"]["Insert"]>;
        Relationships: [];
      };
      professional_time_off: {
        Row: {
          id: string;
          professional_id: string;
          start_date: string;
          end_date: string;
          reason: string | null;
          status: TimeOffStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          professional_id: string;
          start_date: string;
          end_date: string;
          reason?: string | null;
          status?: TimeOffStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["professional_time_off"]["Insert"]>;
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          owner_id: string;
          full_name: string;
          relation: string;
          date_of_birth: string | null;
          gender: string | null;
          species: string | null;
          blood_group: string | null;
          allergies: string[];
          conditions: string[];
          photo_url: string | null;
          is_self: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          full_name: string;
          relation: string;
          date_of_birth?: string | null;
          gender?: string | null;
          species?: string | null;
          blood_group?: string | null;
          allergies?: string[];
          conditions?: string[];
          photo_url?: string | null;
          is_self?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["family_members"]["Insert"]>;
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          id: string;
          owner_id: string;
          full_name: string;
          relation: string;
          phone: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          full_name: string;
          relation: string;
          phone: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["emergency_contacts"]["Insert"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          owner_id: string;
          label: string;
          line1: string;
          line2: string | null;
          neighborhood: string | null;
          city: string;
          state: string;
          pincode: string | null;
          lat: number | null;
          lng: number | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          label: string;
          line1: string;
          line2?: string | null;
          neighborhood?: string | null;
          city?: string;
          state?: string;
          pincode?: string | null;
          lat?: number | null;
          lng?: number | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category: string;
          name: string;
          description: string | null;
          price_from: number;
          duration_mins: number | null;
          is_express_eligible: boolean;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          name: string;
          description?: string | null;
          price_from: number;
          duration_mins?: number | null;
          is_express_eligible?: boolean;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          consumer_id: string;
          patient_id: string | null;
          service_id: string;
          professional_id: string | null;
          address_id: string | null;
          status: BookingStatus;
          is_express: boolean;
          scheduled_at: string;
          price: number;
          payment_status: PaymentStatus;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          arrival_otp: string | null;
          vitals: Json;
          notes: string | null;
          meds_given: Json;
          lab_reports: Json;
          handoff_note: string | null;
          rating: number | null;
          review: string | null;
          tip_amount: number;
          cancelled_reason: string | null;
          escalated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          patient_id?: string | null;
          service_id: string;
          professional_id?: string | null;
          address_id?: string | null;
          status?: BookingStatus;
          is_express?: boolean;
          scheduled_at?: string;
          price?: number;
          payment_status?: PaymentStatus;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          arrival_otp?: string | null;
          vitals?: Json;
          notes?: string | null;
          meds_given?: Json;
          lab_reports?: Json;
          handoff_note?: string | null;
          rating?: number | null;
          review?: string | null;
          tip_amount?: number;
          cancelled_reason?: string | null;
          escalated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      provider_locations: {
        Row: {
          job_type: string;
          job_id: string;
          professional_id: string;
          lat: number;
          lng: number;
          heading: number | null;
          recorded_at: string;
        };
        Insert: {
          job_type: string;
          job_id: string;
          professional_id: string;
          lat: number;
          lng: number;
          heading?: number | null;
          recorded_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_locations"]["Insert"]>;
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          booking_id: string | null;
          meds: Json;
          advice: string | null;
          doctor_signature_url: string | null;
          status: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          booking_id?: string | null;
          meds?: Json;
          advice?: string | null;
          doctor_signature_url?: string | null;
          status?: string;
          issued_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Insert"]>;
        Relationships: [];
      };
      lab_orders: {
        Row: {
          id: string;
          consumer_id: string;
          patient_id: string | null;
          booking_id: string | null;
          tests: string[];
          status: string;
          scheduled_at: string | null;
          file_url: string | null;
          price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          patient_id?: string | null;
          booking_id?: string | null;
          tests: string[];
          status?: string;
          scheduled_at?: string | null;
          file_url?: string | null;
          price?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lab_orders"]["Insert"]>;
        Relationships: [];
      };
      pharmacy_orders: {
        Row: {
          id: string;
          consumer_id: string;
          patient_id: string | null;
          prescription_id: string | null;
          pharmacy_id: string | null;
          delivery_address_id: string | null;
          items: Json;
          status: PharmacyOrderStatus;
          pickup_code: string | null;
          total_price: number | null;
          rating: number | null;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          patient_id?: string | null;
          prescription_id?: string | null;
          pharmacy_id?: string | null;
          delivery_address_id?: string | null;
          items?: Json;
          status?: PharmacyOrderStatus;
          pickup_code?: string | null;
          total_price?: number | null;
          rating?: number | null;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pharmacy_orders"]["Insert"]>;
        Relationships: [];
      };
      ambulance_requests: {
        Row: {
          id: string;
          consumer_id: string;
          patient_init: string | null;
          type: AmbulanceType;
          reason: string | null;
          pickup_address_id: string | null;
          hospital: string | null;
          ambulance_partner_id: string | null;
          status: AmbulanceStatus;
          rating: number | null;
          review: string | null;
          escalated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          patient_init?: string | null;
          type: AmbulanceType;
          reason?: string | null;
          pickup_address_id?: string | null;
          hospital?: string | null;
          ambulance_partner_id?: string | null;
          status?: AmbulanceStatus;
          rating?: number | null;
          review?: string | null;
          escalated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ambulance_requests"]["Insert"]>;
        Relationships: [];
      };
      wallets: {
        Row: { profile_id: string; balance: number; updated_at: string };
        Insert: { profile_id: string; balance?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>;
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          amount: number;
          method: string | null;
          description: string | null;
          reference: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          amount: number;
          method?: string | null;
          description?: string | null;
          reference?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wallet_transactions"]["Insert"]>;
        Relationships: [];
      };
      chat_channels: {
        Row: { id: string; type: ChatChannelType; booking_id: string | null; created_at: string };
        Insert: { id?: string; type: ChatChannelType; booking_id?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["chat_channels"]["Insert"]>;
        Relationships: [];
      };
      chat_channel_members: {
        Row: { channel_id: string; profile_id: string; joined_at: string };
        Insert: { channel_id: string; profile_id: string; joined_at?: string };
        Update: Partial<Database["public"]["Tables"]["chat_channel_members"]["Insert"]>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          channel_id: string;
          sender_id: string;
          body: string | null;
          attachment_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          sender_id: string;
          body?: string | null;
          attachment_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      consent_records: {
        Row: { id: string; profile_id: string; consent_type: string; version: string; accepted_at: string };
        Insert: { id?: string; profile_id: string; consent_type?: string; version: string; accepted_at?: string };
        Update: Partial<Database["public"]["Tables"]["consent_records"]["Insert"]>;
        Relationships: [];
      };
      loyalty_accounts: {
        Row: { profile_id: string; balance: number; updated_at: string };
        Insert: { profile_id: string; balance?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["loyalty_accounts"]["Insert"]>;
        Relationships: [];
      };
      loyalty_transactions: {
        Row: {
          id: string;
          profile_id: string;
          points: number;
          type: "earn" | "redeem";
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          points: number;
          type: "earn" | "redeem";
          reason: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_transactions"]["Insert"]>;
        Relationships: [];
      };
      reward_catalog: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          points_cost: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          points_cost: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reward_catalog"]["Insert"]>;
        Relationships: [];
      };
      reward_redemptions: {
        Row: {
          id: string;
          profile_id: string;
          reward_id: string;
          points_spent: number;
          status: "pending" | "fulfilled";
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          reward_id: string;
          points_spent: number;
          status?: "pending" | "fulfilled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reward_redemptions"]["Insert"]>;
        Relationships: [];
      };
      blood_donors: {
        Row: {
          profile_id: string;
          blood_group: string;
          city: string | null;
          is_available: boolean;
          last_donated_at: string | null;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          blood_group: string;
          city?: string | null;
          is_available?: boolean;
          last_donated_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blood_donors"]["Insert"]>;
        Relationships: [];
      };
      blood_requests: {
        Row: {
          id: string;
          requester_id: string;
          patient_name: string;
          blood_group: string;
          units_needed: number;
          hospital: string | null;
          city: string | null;
          urgency: "urgent" | "soon" | "planned";
          status: "open" | "fulfilled" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          patient_name: string;
          blood_group: string;
          units_needed?: number;
          hospital?: string | null;
          city?: string | null;
          urgency?: "urgent" | "soon" | "planned";
          status?: "open" | "fulfilled" | "cancelled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blood_requests"]["Insert"]>;
        Relationships: [];
      };
      blood_request_responses: {
        Row: { id: string; request_id: string; donor_id: string; created_at: string };
        Insert: { id?: string; request_id: string; donor_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["blood_request_responses"]["Insert"]>;
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          code_used: string;
          status: "pending" | "completed";
          reward_granted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          code_used: string;
          status?: "pending" | "completed";
          reward_granted?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
        Relationships: [];
      };
      push_tokens: {
        Row: { id: string; profile_id: string; token: string; platform: "ios" | "android" | "web"; created_at: string };
        Insert: { id?: string; profile_id: string; token: string; platform: "ios" | "android" | "web"; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["push_tokens"]["Insert"]>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          profile_id: string;
          visit_updates: boolean;
          chat_messages: boolean;
          emergency_alerts: boolean;
          promotions: boolean;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          visit_updates?: boolean;
          chat_messages?: boolean;
          emergency_alerts?: boolean;
          promotions?: boolean;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Insert"]>;
        Relationships: [];
      };
      assistant_conversations: {
        Row: { id: string; profile_id: string; title: string | null; created_at: string };
        Insert: { id?: string; profile_id: string; title?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["assistant_conversations"]["Insert"]>;
        Relationships: [];
      };
      assistant_messages: {
        Row: { id: string; conversation_id: string; role: "user" | "assistant"; content: string; created_at: string };
        Insert: { id?: string; conversation_id: string; role: "user" | "assistant"; content: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["assistant_messages"]["Insert"]>;
        Relationships: [];
      };
      insurance_policies: {
        Row: { id: string; profile_id: string; provider_name: string; policy_number: string; expiry_date: string | null; created_at: string };
        Insert: {
          id?: string;
          profile_id: string;
          provider_name: string;
          policy_number: string;
          expiry_date?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["insurance_policies"]["Insert"]>;
        Relationships: [];
      };
      insurance_claims: {
        Row: {
          id: string;
          policy_id: string;
          profile_id: string;
          booking_id: string | null;
          pharmacy_order_id: string | null;
          claim_amount: number;
          description: string | null;
          status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
          created_at: string;
        };
        Insert: {
          id?: string;
          policy_id: string;
          profile_id: string;
          booking_id?: string | null;
          pharmacy_order_id?: string | null;
          claim_amount: number;
          description?: string | null;
          status?: "submitted" | "under_review" | "approved" | "rejected" | "paid";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["insurance_claims"]["Insert"]>;
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          remind_at: string;
          booking_id: string | null;
          is_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          remind_at: string;
          booking_id?: string | null;
          is_sent?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
        Relationships: [];
      };
      diet_plans: {
        Row: {
          id: string;
          patient_id: string;
          created_by: string;
          title: string;
          meals: Json;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          created_by: string;
          title: string;
          meals?: Json;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["diet_plans"]["Insert"]>;
        Relationships: [];
      };
      program_enrollments: {
        Row: {
          id: string;
          consumer_id: string;
          patient_id: string | null;
          program_key: "home_icu" | "chronic_care" | "checkup_package" | "home_nursing" | "care" | "care_plus" | "family_plus";
          notes: string | null;
          status: "requested" | "contacted" | "active" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          patient_id?: string | null;
          program_key: "home_icu" | "chronic_care" | "checkup_package" | "home_nursing" | "care" | "care_plus" | "family_plus";
          notes?: string | null;
          status?: "requested" | "contacted" | "active" | "cancelled";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["program_enrollments"]["Insert"]>;
        Relationships: [];
      };
      second_opinion_requests: {
        Row: {
          id: string;
          consumer_id: string;
          patient_id: string | null;
          prescription_id: string | null;
          question: string;
          doctor_id: string | null;
          response: string | null;
          status: "open" | "claimed" | "answered";
          created_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          patient_id?: string | null;
          prescription_id?: string | null;
          question: string;
          doctor_id?: string | null;
          response?: string | null;
          status?: "open" | "claimed" | "answered";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["second_opinion_requests"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      request_role: { Args: { p_role: string }; Returns: void };
      approve_role: { Args: { p_professional_id: string; p_role: string; p_team_id: string }; Returns: void };
      reject_role: { Args: { p_professional_id: string; p_role: string }; Returns: void };
      team_admin_of: { Args: { p_professional_id: string }; Returns: string | null };
      redeem_reward: { Args: { p_reward_id: string }; Returns: string };
      redeem_referral_code: { Args: { p_code: string }; Returns: void };
      pay_tip_from_wallet: { Args: { p_booking_id: string; p_amount: number }; Returns: void };
      admin_add_team_member: { Args: { p_phone: string; p_role: string; p_team_id: string }; Returns: string };
      create_chat_channel: {
        Args: { p_type: string; p_booking_id: string | null; p_extra_member_id?: string | null };
        Returns: { id: string; type: ChatChannelType; booking_id: string | null; created_at: string };
      };
      admin_review_time_off: { Args: { p_time_off_id: string; p_status: string }; Returns: void };
    };
    Enums: {
      verification_status: VerificationStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      pharmacy_order_status: PharmacyOrderStatus;
      ambulance_type: AmbulanceType;
      ambulance_status: AmbulanceStatus;
      payout_method_type: PayoutMethodType;
      payout_status: PayoutStatus;
      chat_channel_type: ChatChannelType;
      team_member_status: TeamMemberStatus;
    };
  };
}
