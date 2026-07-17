// Terms of Service + Privacy Policy content, shared verbatim by both apps
// (one company, one policy) so a future edit can't drift out of sync between
// them. Each app renders these sections with its own design tokens.
//
// IMPORTANT: this is a first draft, not reviewed or approved legal counsel.
// Anywhere marked "[FILL IN: ...]" is a placeholder that needs the actual
// registered business details before this can go live -- see the flags
// raised alongside this file for the full list of what's still open.
export const CONSENT_VERSION = "2026-07-17";

export interface LegalSection {
  heading: string;
  body: string;
}

export const TERMS_OF_SERVICE_TITLE = "Terms of Service";
export const TERMS_OF_SERVICE_EFFECTIVE_DATE = "17 July 2026";

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: "1. Who we are and what this agreement covers",
    body:
      "CuraLink and CuraLink Plus (together, \"CuraLink\", \"we\", \"us\") are operated by [FILL IN: registered legal entity name, e.g. \"CuraLink Health Technologies Private Limited\"], a company incorporated in India with its registered office at [FILL IN: registered address] (CIN: [FILL IN]). These Terms of Service (\"Terms\") govern your access to and use of the CuraLink mobile application and website (for patients and families) and the CuraLink Plus mobile application (for verified healthcare and support professionals), together the \"Platform\". By creating an account, you agree to these Terms and to our Privacy Policy.",
  },
  {
    heading: "2. What CuraLink is — and is not",
    body:
      "CuraLink is a technology platform that connects you with independent, verified healthcare professionals (nurses, doctors, veterinarians), pharmacy partners, and ambulance partners who offer home-visit, teleconsultation, medicine delivery, and patient-transport services in and around Hyderabad. CuraLink itself is not a hospital, clinic, pharmacy, or ambulance operator, and does not employ the professionals who accept your bookings — they are independent professionals or partner businesses who are separately verified (license checks, background checks, and document review) before they can accept jobs on the Platform. CuraLink is not a party to the actual healthcare service rendered between you and the professional; our role is to facilitate discovery, scheduling, communication, and payment for that service.",
  },
  {
    heading: "3. Not for medical emergencies",
    body:
      "CuraLink is designed for scheduled and rapid-response home healthcare — it is not an emergency service. If you or someone with you is experiencing a life-threatening emergency, call 108 (India's national emergency number) or go to the nearest emergency room immediately. Do not use this Platform, including the SOS/ambulance-request feature, as a substitute for calling emergency services when every minute matters — our ambulance-partner network operates on a best-effort, request-and-accept basis and cannot guarantee a response time.",
  },
  {
    heading: "4. Cura Assistant and second-opinion features are informational only",
    body:
      "Cura Assistant (our in-app chat assistant) and the second-opinion feature are provided to help you navigate the Platform, understand your bookings, and get informal guidance — they are not a substitute for, and must not be relied on as, professional medical advice, diagnosis, or treatment. Always consult a qualified, licensed healthcare professional for medical decisions. Any doctor who responds to a second-opinion request is doing so informally and outside the context of a full clinical examination; it does not replace an in-person or teleconsultation diagnosis.",
  },
  {
    heading: "5. Eligibility and accounts",
    body:
      "You must be at least 18 years old and able to form a legally binding contract under Indian law to create a CuraLink account. You may add family members of any age (including minors, elderly relatives, or dependents) to your account and book services on their behalf, but the account itself, and legal responsibility for it, belongs to the adult who registered it. You're responsible for keeping your phone number and account access secure, and for all activity under your account. One phone number may only be associated with one account.",
  },
  {
    heading: "6. Booking, pricing, and payment",
    body:
      "Prices shown for each service are starting estimates (\"from ₹X\"); the final price depends on the specifics of your visit and is confirmed by the assigned professional. As of this version, CuraLink bookings are completed on a \"pay after care\" basis — no payment is collected at the time of booking, and you settle payment with your assigned professional directly (cash, UPI, or another method they support) after the service is complete. Online in-app payment (UPI/Card/Wallet) is planned but not yet active; this section will be updated with processor details (Razorpay) once it is. CuraLink Wallet balances, where used (e.g. tips), are held for your use within the Platform and are not a bank deposit.",
  },
  {
    heading: "7. Cancellations",
    body:
      "You may cancel a pending or confirmed booking at any time before the professional begins traveling to you, free of charge, since no payment is collected upfront under the current payment model. Repeated last-minute cancellations may affect your ability to book rapid/express visits in the future. If a professional or the Platform needs to cancel a confirmed booking (e.g. no professional becomes available within a reasonable time), you'll be notified and, where relevant, offered rebooking assistance.",
  },
  {
    heading: "8. Your health information",
    body:
      "You retain ownership of the health information you or a professional adds to your account (vitals, prescriptions, visit notes, lab records, medical history). By using the Platform you grant CuraLink, and the specific professional(s) assigned to your booking, a license to access, store, and process that information solely to deliver and coordinate your care and for the purposes described in our Privacy Policy. We do not sell your health information to advertisers or data brokers.",
  },
  {
    heading: "9. Conduct",
    body:
      "You agree not to use the Platform to harass, threaten, or discriminate against professionals or other users; to provide false information about your identity, health, or location; to attempt to circumvent the Platform to arrange off-platform payment for a booking that originated here; or to use the live-location, chat, or Cura Assistant features for any unlawful purpose. Professionals using CuraLink Plus separately agree to their own professional-conduct obligations as part of onboarding.",
  },
  {
    heading: "10. Third-party services used to deliver CuraLink",
    body:
      "Certain features route through third-party services outside CuraLink's direct control, and your use of them is also subject to that third party's own terms: teleconsultation call handoff currently happens over WhatsApp (Meta Platforms, Inc.); live-tracking maps use OpenStreetMap map data; SMS/OTP delivery uses MSG91; push notifications use Firebase Cloud Messaging (Google). We choose these providers carefully but are not responsible for their availability or their own handling of data once a conversation or request leaves CuraLink's systems (for example, a WhatsApp message you send to a doctor is subject to WhatsApp's terms, not this one).",
  },
  {
    heading: "11. Limitation of liability",
    body:
      "To the maximum extent permitted by Indian law, CuraLink's liability for any claim arising from your use of the Platform is limited to the amount you paid for the specific booking giving rise to the claim. CuraLink is not liable for the acts, omissions, or professional judgment of independent professionals using the Platform, though we take verification, ratings, and complaint handling seriously and will act on credible reports of misconduct or unsafe care.",
  },
  {
    heading: "12. Termination",
    body:
      "You may stop using the Platform and request account closure at any time. We may suspend or terminate accounts that violate these Terms, engage in fraud, or pose a safety risk to professionals or other users.",
  },
  {
    heading: "13. Governing law and disputes",
    body:
      "These Terms are governed by the laws of India. Courts in Hyderabad, Telangana shall have exclusive jurisdiction over any dispute arising from these Terms or your use of the Platform, subject to any mandatory consumer-forum rights you have under Indian consumer protection law.",
  },
  {
    heading: "14. Grievance Officer",
    body:
      "In accordance with the Information Technology Act, 2000, the Consumer Protection (E-Commerce) Rules, 2020, and the Digital Personal Data Protection Act, 2023, our Grievance Officer can be reached at: [FILL IN: Grievance Officer name], [FILL IN: email address], [FILL IN: postal address]. We aim to acknowledge complaints within 48 hours and resolve them within 30 days.",
  },
  {
    heading: "15. Changes to these Terms",
    body:
      "We may update these Terms from time to time. If we make material changes, we'll ask you to re-accept them the next time you sign in. Continued use of the Platform after a change means you accept the updated Terms.",
  },
];

export const PRIVACY_POLICY_TITLE = "Privacy Policy";
export const PRIVACY_POLICY_EFFECTIVE_DATE = "17 July 2026";

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: "1. Scope and our role as Data Fiduciary",
    body:
      "This Privacy Policy explains how [FILL IN: registered legal entity name] (\"CuraLink\", \"we\", \"us\"), the Data Fiduciary under the Digital Personal Data Protection Act, 2023 (\"DPDP Act\"), collects, uses, shares, and protects personal data (including health-related personal data) processed through the CuraLink and CuraLink Plus apps. It applies to consumers, family members added to a consumer's account, and professionals/partners using CuraLink Plus.",
  },
  {
    heading: "2. Personal data we collect",
    body:
      "Identity & contact: full name, phone number, and email if provided. Health data: vitals, prescriptions, medications, allergies, conditions, lab reports, and visit notes for you and any family members you add. Location data: your registered addresses, and — while a booking or ambulance request is en route — the live GPS position of the assigned professional (shown to you on a map so you can track your visit), and the assigned professional's own live position while working. Payment-related data: booking amounts, wallet transactions, and payout details for professionals (we do not yet store card numbers directly; when online payment is enabled this will be handled by a PCI-compliant payment processor, not stored on our servers). Device & usage data: app version, device push-notification token, and basic usage logs for reliability and abuse prevention.",
  },
  {
    heading: "3. Why we process your data",
    body:
      "To create and secure your account (phone-based verification). To connect you with an appropriate professional and let them access the specific health information needed for your visit. To show you live tracking and ETA for an active visit or ambulance trip. To process bookings, payouts, and wallet activity. To send you booking, chat, and reminder notifications. To operate safety features (SOS, emergency contacts). To improve the Platform and investigate complaints or misuse. We do not use your health data for advertising, and we do not sell personal data to third parties.",
  },
  {
    heading: "4. Consent",
    body:
      "We rely on your explicit, informed consent — given when you check the consent box at signup and again wherever a specific screen asks for it (for example, granting location permission for live tracking) — as the basis for processing your personal data, as required under Section 6 of the DPDP Act. You may withdraw consent at any time by contacting us or deleting your account, though withdrawing consent may mean we can no longer provide some or all of the Platform's services to you, and we may need to retain certain records where required by law (see Section 7 below).",
  },
  {
    heading: "5. Who we share data with",
    body:
      "The specific professional(s) assigned to your booking (so they can provide care). Your team's Partner Admin, for oversight of jobs assigned to their team, in aggregate or as needed to resolve an issue. Service providers who process data on our behalf under contract: Supabase (database, authentication, and file storage — data may be stored or processed on infrastructure outside India; the DPDP Act permits this except to countries the Government of India may restrict by notification), MSG91 (SMS/OTP delivery), Google/Firebase (push notifications), and, if you use the WhatsApp teleconsult handoff, Meta Platforms, Inc. for that specific conversation. Law enforcement or regulators, only where legally required. We do not sell personal data to advertisers or data brokers.",
  },
  {
    heading: "6. How long we keep your data",
    body:
      "We retain your personal data for as long as your account is active, and for a reasonable period afterward to comply with legal, medical-record, tax, or dispute-resolution obligations. If you request deletion, we will erase or irreversibly anonymize your personal data except where we are legally required to retain it (for example, financial transaction records under applicable law).",
  },
  {
    heading: "7. Your rights under the DPDP Act, 2023",
    body:
      "You have the right to: access a summary of the personal data we hold about you and how it's been processed; request correction or completion of inaccurate or incomplete personal data; request erasure of personal data that is no longer necessary for the purpose it was collected, subject to legal retention requirements; withdraw consent at any time; nominate another individual to exercise these rights on your behalf in the event of your death or incapacity; and file a grievance with us, and if unresolved, with the Data Protection Board of India. To exercise any of these rights, contact our Grievance Officer (Section 10 below).",
  },
  {
    heading: "8. Children's data",
    body:
      "CuraLink accounts are created by adults (18+). Family members of any age, including minors, may be added to an adult's account by that adult so care can be booked on their behalf — we do not knowingly allow a minor to independently create or control their own CuraLink account or independently consent to data processing.",
  },
  {
    heading: "9. Security",
    body:
      "We use industry-standard safeguards to protect your data, including encryption in transit and at rest, database-level row-level-security access controls so a given user or professional can only read the specific records they're authorized to see, and role-based access restrictions for our own team. No system is 100% secure, and we will notify affected users and the Data Protection Board as required by law in the event of a significant personal data breach.",
  },
  {
    heading: "10. Grievance Officer & contact",
    body:
      "For any question about this Policy or to exercise your rights under the DPDP Act, contact our Grievance Officer: [FILL IN: Grievance Officer name], [FILL IN: email address], [FILL IN: postal address]. We aim to acknowledge privacy requests within 48 hours and resolve them within 30 days.",
  },
  {
    heading: "11. Changes to this Policy",
    body:
      "We may update this Privacy Policy from time to time. If we make a material change to what we collect or how we use it, we'll ask you to re-consent the next time you sign in.",
  },
];
