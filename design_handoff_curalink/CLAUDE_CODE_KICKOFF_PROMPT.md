# Claude Code kickoff prompt — CuraLink + CuraLink Plus (build both in parallel)

Paste this into Claude Code at the root of a fresh repo containing this handoff package.

---

I'm building **CuraLink** (patient/family consumer app) and **CuraLink Plus** (staff/provider app: nurse, doctor, vet, pharmacy partner, ambulance partner, admin) for a home-healthcare service in Hyderabad, India. They share ONE backend. Read `README.md` in this folder fully first — it has the screen list, design tokens, shared-entity schema, interaction contracts, and recommended stack for both apps. Then read the prototypes in `prototypes/CuraLink.dc.html` and `prototypes/CuraLink Plus.dc.html` directly (open/search them, don't guess) whenever you need exact copy, layout, or component states for a screen — treat them as the functional + visual spec, not code to port.

**Stack** (per README "Recommended production stack"): Turborepo/Nx monorepo, `apps/curalink` + `apps/curalink-plus` on React Native + Expo (EAS), Expo Router + React Native Web for the web build, shared `packages/ui` and `packages/api-client`. Backend: Supabase (Postgres + Auth/OTP + Realtime + Storage + RLS). Razorpay for payments/payouts. Google Maps SDK for live tracking (swap in for the prototype's Leaflet embed). FCM push. Server-proxied Claude API route for the Cura Assistant/Cura AI — never call it from the client with a bare key.

**Build both apps in parallel, against one shared contract, in this order:**

1. **Monorepo scaffold** — Turborepo, both Expo apps booting to a blank screen, shared `packages/ui` and `packages/api-client` stubs, TypeScript strict mode, shared ESLint/Prettier config.
2. **Supabase schema + RLS** — implement the full shared-entity table from the README (User/Professional with `roles: text[]`, Booking/Visit with the full status enum, ProviderLocation, Prescription, LabOrder, PharmacyOrder, AmbulanceRequest, Wallet/Transaction, TeamRoster, ChatChannel/Message, PayoutMethod/Record). Write RLS policies per the README's access rules (consumer sees own bookings; provider sees only assigned jobs; admin sees only their team). Seed with the realistic Hyderabad data from the prototypes (real neighborhood names, ₹ pricing, staff names) as local/staging seed data.
3. **Auth** — phone OTP via Supabase Auth + Twilio/MSG91, JWT session, multi-role support (`roles` array, active-role switch with zero re-auth) for CuraLink Plus.
4. **Design tokens + shared component library**, one set per app, matching the README's token tables exactly (CuraLink "Caring Warmth": Bricolage Grotesque + Inter, coral/sage; CuraLink Plus "Clinical Confidence": Plus Jakarta Sans + Inter, teal/amber, per-role accent colors). Buttons, fields, cards, status pills, bottom nav + FAB, bottom sheets, skeletons — build each once, reuse everywhere.
5. **Onboarding → Home shell + bottom nav**, both apps, all CuraLink Plus roles' role-aware onboarding.
6. **CuraLink booking flow** (incl. express/instant booking against a real "nearest available provider" query) + Razorpay checkout, matching the prototype's success AND payment-failed states.
7. **Live visit tracking + GPS publish/subscribe** — build together: CuraLink Plus's En-route/Arrived/Transport screens publish GPS via Supabase Realtime; CuraLink's live-tracking map subscribes to the same channel. This is the core cross-app feature — get it working end-to-end before moving on.
8. **Remaining core loops**: CuraLink profile/family/history/prescriptions/wallet; CuraLink Plus visit workflow (vitals/notes/meds/photos/labs), earnings, payouts.
9. **Pharmacy fulfillment loop and ambulance dispatch loop**, end-to-end, touching both apps (order/request creation in CuraLink, fulfillment/dispatch in Plus, live status back in CuraLink).
10. **CuraLink Plus multi-role accounts + team chat**; admin dashboard, live dispatch map (nurse/pharmacy/ambulance pins), roster, compliance, analytics, payouts.
11. **Remaining long-tail screens** in both apps per the README's full screen list.
12. **Support/settings/notifications, dark mode (Plus especially — night-shift users), polish, and the Cura Assistant/Cura AI server-proxied integration.**

Work in small, testable increments — after each numbered step, show me it running (simulator screenshot or web preview) before moving to the next. Ask me before making any product decision the README/prototypes don't already answer; don't invent scope.
