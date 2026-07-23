export const apiClientPackageName = "@curalink/api-client";

export { supabase } from "./supabaseClient";
export {
  sendPhoneOtp,
  resendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  resendEmailOtp,
  verifyEmailOtp,
  verifyMsg91AccessToken,
  signInWithPhonePassword,
  signInWithGoogle,
  createSessionFromUrl,
  updatePhoneNumber,
  signOut,
  fetchProfile,
  requestRole,
  toE164IndianPhone,
  toMsg91Identifier,
  toWhatsAppLink,
  recordConsent,
  hasRecordedConsent,
} from "./auth";
export { useSessionStore, initSessionListener } from "./sessionStore";

export {
  CONSENT_VERSION,
  TERMS_OF_SERVICE_TITLE,
  TERMS_OF_SERVICE_EFFECTIVE_DATE,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY_TITLE,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY,
} from "./legalContent";
export type { LegalSection } from "./legalContent";
export { getErrorMessage } from "./errors";
export { PROFESSIONAL_ROLES, isProfessionalRole } from "./types";
export type { Profile, ProfessionalProfile, ProfessionalRole } from "./types";
export type { Database, Json } from "./database.types";

export {
  fetchFamilyMembers,
  fetchFamilyMember,
  createFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  fetchEmergencyContacts,
  createEmergencyContact,
  deleteEmergencyContact,
  fetchAddresses,
  createAddress,
  fetchLabOrders,
  createLabOrder,
  fetchProviderProfile,
  fetchMedicalTeam,
  fetchServices,
  fetchServicesByCategory,
  fetchServiceById,
  createBooking,
  fetchActiveBooking,
  fetchUpcomingBookings,
  fetchPastBookings,
  fetchBookingById,
  fetchBookingDetail,
  fetchVitalsHistory,
  fetchWalletBalance,
  fetchWalletTransactions,
  fetchWalletTransactionById,
  fetchBookAgain,
  fetchPrescriptionsForOwner,
  fetchPrescriptionById,
  fetchPrescriptionDetail,
  createPharmacyOrderFromPrescription,
  fetchPharmacyPartners,
  rateBooking,
  payTipFromWallet,
} from "./consumer";
export type { BookAgainCard, BookingDetail, MedicalTeamMember, PharmacyPartner, PrescriptionDetail, ProviderProfileDetail } from "./consumer";

export {
  fetchProfessionalProfile,
  updateProfessionalProfile,
  fetchProfessionalCredentials,
  updateProfessionalCredentials,
  setOnDuty,
  fetchActiveJob,
  fetchAvailableJobs,
  fetchTeamRoster,
  fetchMyTeam,
  fetchIncomingPharmacyOrders,
  fetchIncomingAmbulanceRequests,
  subscribeToAvailableJobs,
  subscribeToIncomingPharmacyOrders,
  subscribeToIncomingAmbulanceRequests,
  fetchBookingReviews,
  fetchJobHistory,
  fetchJobDetail,
  acceptJob,
  updateBookingStatus,
  updateVisitFields,
  completeVisit,
  fetchCompletedBookingsSince,
  fetchPayoutMethods,
  createPayoutMethod,
  fetchPayoutRecords,
  createPrescription,
  fetchPrescriptionsByDoctor,
  fetchMyTimeOff,
  requestTimeOff,
  cancelTimeOff,
  fetchTeamTimeOff,
  reviewTimeOff,
} from "./professional";
export type { JobDetail, VisitFieldsPatch } from "./professional";

export {
  fetchConsumerPharmacyOrders,
  fetchPharmacyOrderDetail,
  fetchActivePharmacyOrders,
  fetchActivePharmacyOrderLocations,
  fetchPharmacyOrderHistory,
  claimPharmacyOrder,
  updatePharmacyOrderItems,
  advancePharmacyOrderStatus,
  ratePharmacyOrder,
  fetchPharmacyOrderReviews,
} from "./pharmacyOrders";
export type { PharmacyOrderDetail, PharmacyOrderLocation } from "./pharmacyOrders";

export {
  createAmbulanceRequest,
  fetchConsumerAmbulanceRequests,
  fetchActiveAmbulanceRequest,
  fetchAmbulanceRequestDetail,
  fetchActiveAmbulanceJob,
  fetchAmbulanceRequestHistory,
  claimAmbulanceRequest,
  advanceAmbulanceStatus,
  rateAmbulanceRequest,
  fetchAmbulanceRequestReviews,
} from "./ambulanceRequests";
export type { AmbulanceRequestDetail } from "./ambulanceRequests";

export {
  fetchPendingApplications,
  approveRoleApplication,
  rejectRoleApplication,
  createTeam,
  fetchTeamActiveBookings,
  fetchTeamActiveAmbulanceRequests,
  reassignJob,
  fetchTeamAdminOf,
  fetchTeamBookingRevenue,
  fetchTeamPharmacyRevenue,
  fetchTeamPayoutRecords,
  fetchTeamAllBookings,
  addTeamMemberByPhone,
  fetchTeamMemberDetail,
  fetchTeamRosterWithProfiles,
  updateTeamMemberStatus,
  updateTeamMemberDocsOk,
  fetchPharmacyCompletedCounts,
  fetchAmbulanceCompletedCounts,
  fetchTeamMemberRatings,
  reassignAmbulanceRequest,
  fetchEscalatedBookings,
  fetchEscalatedAmbulanceRequests,
} from "./admin";
export type { PendingApplication, TeamMemberDetail, RosterEntry } from "./admin";

export {
  fetchMyChannels,
  fetchOrCreateCareTeamChannel,
  fetchOrCreateOpsChannel,
  fetchOrCreateEscalationChannel,
  fetchMessages,
  sendMessage,
  subscribeToChannelMessages,
} from "./chat";
export type { MyChannel } from "./chat";

export { fetchNotifications, markNotificationRead, markAllNotificationsRead } from "./notifications";

export {
  fetchLoyaltyAccount,
  fetchLoyaltyTransactions,
  fetchRewardCatalog,
  fetchRewardRedemptions,
  redeemReward,
} from "./loyalty";

export {
  fetchMyDonorProfile,
  upsertDonorProfile,
  fetchOpenBloodRequests,
  fetchMyBloodRequests,
  createBloodRequest,
  updateBloodRequestStatus,
  fetchResponsesForRequest,
  respondToBloodRequest,
  fetchMyResponses,
} from "./bloodDonation";

export { fetchMyReferralCode, fetchMyReferrals, redeemReferralCode } from "./referrals";

export {
  registerPushToken,
  unregisterPushToken,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "./pushNotifications";

export {
  fetchOrCreateAssistantConversation,
  fetchAssistantMessages,
  sendAssistantMessage,
  subscribeToAssistantMessages,
} from "./curaAssistant";

export { fetchInsurancePolicies, createInsurancePolicy, fetchInsuranceClaims, createInsuranceClaim } from "./insurance";

export { fetchReminders, createReminder, deleteReminder } from "./reminders";

export {
  fetchDietPlansForPatient,
  fetchDietPlansForOwner,
  fetchDietPlansCreatedBy,
  createDietPlan,
} from "./dietPlans";

export { fetchMyEnrollments, createEnrollment } from "./programEnrollments";

export {
  fetchMySecondOpinionRequests,
  createSecondOpinionRequest,
  fetchOpenSecondOpinionRequests,
  fetchMyClaimedSecondOpinionRequests,
  claimSecondOpinionRequest,
  answerSecondOpinionRequest,
} from "./secondOpinion";

export {
  publishProviderLocation,
  fetchProviderLocation,
  fetchProviderLocationsForJobs,
  subscribeToProviderLocation,
} from "./location";
export type { JobType } from "./location";
