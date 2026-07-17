# Handoff: CuraLink — Consumer Home-Healthcare App (Hyderabad)

> Tagline: **"Care, comfort, connected."**
> Platform: iOS-first mobile app (portrait, ~402×874 device frame in the prototype).
> This is the **customer-facing** app. A **staff app (CuraLink Plus)** will be built separately in a new chat and **shares the same backend** — see the "Shared Backend" section, which is the most important part of this doc for the API/data design.

---

## 1. Overview

CuraLink lets Indian families book qualified nurses, doctors, physiotherapists, vets, lab tests, and ambulances to come to their **home**. The core user is an adult child (25–45) managing care for aging parents, a young parent managing kids' illnesses, or a pet owner — usually opening the app in a stressful, worried moment. The product must feel like **a calm, competent friend**, not medical chrome.

**Primary USP: rapid home care — a verified nurse at your door within the hour, one-tap instant booking, live tracking.** This is not a minor feature; it is the reason the app exists and must be treated as the hero of the whole experience.

The prototype covers the entire app (not selected highlights): onboarding/auth, home, full booking flow, live-visit tracking, profile/family, history/prescriptions, wallet/payments, support/settings, plus the extended surfaces added over the project: vitals, care plan, insurance/claims, lab reports, pharmacy orders, subscription plans, reviews & ratings, ambulance booking, book-a-lab-test, medical team, and second-opinion chat.

---

## 2. About the Design Files

The files in this bundle are **design references created in HTML** — a live, tap-through prototype that shows the intended look, motion, and behavior. **They are not production code to copy directly.**

The task is to **recreate these designs in a real mobile codebase** using its established patterns and libraries. Recommended target if none exists yet:

- **React Native (Expo)** + TypeScript for the app
- **React Navigation** (native-stack + bottom-tabs) for routing
- A backend of **Node/Express (or NestJS) + PostgreSQL + Prisma**, OR **Supabase** (Postgres + Auth + Realtime + Storage) if you want batteries-included. Supabase Realtime maps very cleanly onto the live-tracking and chat needs.

The single HTML file is authored as one component with an internal screen router and a big in-memory data object. In the real app you will split this into screens/components and replace the in-memory data with API calls. The prototype's structure is a faithful map of screens, state, and flows — mine it for exact copy, colors, and interaction detail.

### How the prototype is built (so you can read it)
- `CuraLink.dc.html` — the whole app. It's a "Design Component": a template (markup with `{{ }}` holes and `<sc-if>` / `<sc-for>` control flow) plus a `class Component` logic class holding `state`, a static `DATA` object, and a `renderVals()` method that returns everything the template binds to.
- Screen routing = a single `state.screen` string switched through `goTo(name)` / `back()`, with a `stack` array for back navigation. Every screen is a `<sc-if value="{{ show.<name> }}">` block with a `data-screen-label` attribute.
- All styling is **inline** on elements. There is no CSS framework — treat the inline styles as the spec.
- Ignore the DC runtime mechanics (`support.js`, `<x-import>`, `ios-frame.jsx`); they are prototype scaffolding, not part of the product.

---

## 3. Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, radii, shadows, motion, and realistic Indian content are all intentional. Recreate the UI **pixel-accurately** using the target codebase's component library, then wire real data/behavior behind it. Where this doc gives a hex or px value, it is the intended value.

---

## 4. Design System — "Caring Warmth" (current green/navy/white theme)

> Note on history: the app began on a warm coral palette (preserved as `CuraLink Coral v1.dc.html`). The **current, canonical** theme flips to the real CuraLink brand — **green primary, navy trust, near-white minimalist** — inspired by curalink.co.in. Build against the green/navy values below. The coral file is included only as an alternate reference; do not build from it.

### 4.1 Color tokens

**Brand**
| Token | Hex | Use |
|---|---|---|
| `primary` | `#00C27C` | Primary green — CTAs, active states, accents |
| `primary-strong` | `#00CE86` | Brighter green (gradient top, splash) |
| `primary-press` | `#057A4E` | Pressed/darker green, gradient bottom, "from ₹" prices |
| `primary-tint` | `#E9FBF3` | Light green fill (icon chips, info strips) |
| `primary-tint-border` | `#CFF3E2` | Border on green tint surfaces |
| `accent-green-vivid` | `#00E392` | Vivid green on dark navy surfaces |
| `navy` | `#0B1D2E` | Trust/deep sections, dark cards, headings-on-dark |
| `navy-2` | `#142A3E` | Navy gradient bottom |
| `navy-soft` | `#1D3A52` | Borders inside navy |

**Neutrals (cool, minimalist)**
| Token | Hex | Use |
|---|---|---|
| `bg` | `#FAFAF8` | App background (near-white, faint warm) |
| `surface` | `#FFFFFF` | Cards, inputs, sheets |
| `ink` | `#0A1B2A` | Primary text |
| `ink-2` | `#334A5E` | Body text on cards |
| `muted` | `#51677C` | Secondary text |
| `muted-2` | `#6B7E90` | Tertiary text |
| `faint` | `#98A6B4` | Captions, placeholders |
| `faint-2` | `#B7C2CD` | Chevrons, disabled icon |
| `border` | `#E3E7EA` | Default 1px borders (inputs, back buttons) |
| `border-2` | `#E8ECEF` | Card borders |
| `divider` | `#EEF0F2` / `#EIF...` | Row dividers inside cards (`#EEF0F2`) |
| `track` | `#EDEFF1` | Progress track, disabled button bg |
| `chip-neutral` | `#EEF2F6` / `#F4F5F3` | Neutral icon chips / helpful pill |

**Semantic (warm-tuned)**
| Token | Hex | Use |
|---|---|---|
| `success` | `#0E9F6E` | Success text |
| `success-tint` | `#E6F7EF` | Success pill bg |
| `warning` | `#B45309` | Warning text (en-route, fasting, processing) |
| `warning-tint` | `#FCF1E1` | Warning pill bg |
| `error` | `#C81E1E` | Error/logout text |
| `error-strong` | `#B01717` | Destructive gradient bottom |
| `error-cta` | `#D64545` | Destructive/ambulance CTA |
| `error-tint` | `#FCEAEA` | Error/emergency icon chip bg |
| `info` | `#1D6FB8` | Info text (confirmed pill, weight vital) |
| `info-tint` | `#E7F1FB` | Info pill/chip bg |
| `star` | `#E8A33D` | Rating stars |

**Category accent colors** (icon chips / avatars): nurse/nursing `#057A4E` on `#E9FBF3`; doctor `#142A3E`; physio `#B45309` on `#FCF1E1`; vet `#B87333`; pediatric/lead `#6D5FA3` on `#EAE7F2`; lab/navy `#0B1D2E` on `#EEF2F6`.

**Dark mode** (defined, light-first): warm-charcoal navy background (`#0B1D2E` base, `#142A3E` cards, `#1D3A52` borders), brightened `#00E392` green and sage accents, `#F5EEE5`→`#EFF2F4` light text. The prototype ships a `setDark` toggle in Settings; wire it to a theme provider.

### 4.2 Typography
- **Display / headings:** **Bricolage Grotesque** (weights 400–800). Used for greetings, screen titles, numbers-as-hero, button labels. Tight letter-spacing on large sizes (`-.3` to `-1px`).
- **Body / UI / numbers:** **Inter** (400–700).
- (A serif, DM Serif Display, is loaded but reserved; body/number is Inter.)

**Type scale (px / weight) as used:**
| Role | Size | Weight | Family |
|---|---|---|---|
| Display (splash/hero numbers) | 30–42 | 800 | Bricolage |
| H1 (screen title) | 24–27 | 800 | Bricolage |
| H2 (section) | 19–22 | 800 | Bricolage |
| H3 (card title) | 15–16.5 | 700–800 | Bricolage |
| Body large | 16 | 400 | Inter |
| Body | 13.5–14.5 | 400–600 | Inter |
| Body small | 12–13 | 400–600 | Inter |
| Caption | 10.5–11.5 | 500–700 | Inter |
| Eyebrow/label | 11 | 700, `letter-spacing:1.2–1.6px`, UPPERCASE | Inter |

Minimum readable size in this UI is ~10.5px (captions only); hit targets ≥44px.

### 4.3 Spacing, radii, shadows
- **Spacing:** 8pt scale, generous whitespace. Common paddings: screens `20px` horizontal; cards `14–18px`; sticky footers `14px 20px 44px`.
- **Radii:** cards **16–20px**; buttons **12–14px**; icon chips **11–16px**; pills **99px**; sheets **28px** top corners.
- **Shadows:**
  - card: `0 2px 10px rgba(11,29,46,.04)`
  - green CTA: `0 8px 20px rgba(0,194,124,.22–.28)`
  - navy/dark card: `0 12px 26px rgba(11,29,46,.2)`
  - destructive CTA: `0 8px 20px rgba(214,69,69,.32)`
- **Status bar / notch:** screen content starts at `~70px` top padding to clear the device status bar.

### 4.4 Iconography
**Feather / Lucide line icons**, `stroke-width` 1.8–2.4, `stroke-linecap/linejoin: round`, no fills except rating stars and status dots. Keep this exact aesthetic — do not swap in filled/Material icons.

### 4.5 Components (reusable library to build)
- **Buttons:** primary (green, white text, shadow), secondary (white + `#E3E7EA` border), ghost (green text only), destructive (white + `#F3D0CE` border, red text OR red gradient for ambulance/SOS), icon-only (square 38–50px). States: default / pressed (`transform:scale(.98)`, darker green `#057A4E`) / disabled (`#EDEFF1` bg, `#98A6B4` text, no shadow).
- **Text fields:** 52px height, 14px radius, white, `1.5px #E3E7EA` border → focus `#00C27C` + `0 0 0 3px rgba(0,194,124,.12)`. Variants: **+91 phone prefix** (flag + "+91" divider), **password reveal** (eye toggle), textarea.
- **Cards:** white, `1px #E8ECEF`, 16–20px radius, `0 2px 10px rgba(11,29,46,.04)`.
- **Status pills** (99px radius, 11px/700 text): `pending` warn, `confirmed` info, `enroute` warn (amber, distinct from confirmed), `inprogress` green, `completed` success, `cancelled` neutral.
- **Bottom navigation:** 5 tabs — Home, Bookings, **Book (center FAB, raised, green gradient)**, Wallet, Profile. Frosted `rgba(255,252,248,.94)` + blur, top border, active tab = green + weight 700.
- **Bottom-sheet modal:** dim overlay `rgba(45,30,22,.45)`, sheet slides up (`clSheet` keyframe), 40px grab handle. (Payment-failed sheet is the reference.)
- **Empty states:** circular tinted icon + Bricolage title + muted body + CTA (see Bookings "No upcoming visits").
- **Loading skeletons:** `#EFE6DA`/`#EDEFF1` blocks with `clShimmer` pulse (Home has a full skeleton).
- **Toasts:** dark `#0B1D2E` pill, bottom, `clUp` entrance, green check icon, ~2.6s auto-dismiss.

### 4.6 Animations / keyframes (durations & easing)
Defined in `<style>`: `clPulse` (2s ring), `clShimmer` (1.4s skeleton), `clUp` (.3–.5s slide+fade), `clFade` (.25–.4s), `clSheet` (.35s `cubic-bezier(.32,.72,.35,1)`), `clSpin` (.8s linear loader), `clPing` (1.8s map pin), `clDot` (1.1–1.2s typing/loader dots), `clDrive` (8s map vehicle drift). Screen transitions use `clFade`; cards entering use `clUp`. Recreate with Reanimated / Moti.

---

## 5. Screens / Views (complete inventory)

Each screen in the prototype carries a `data-screen-label`. Below: name · purpose · key layout/components/copy. Read the HTML block for pixel detail.

### A. Onboarding & Auth
1. **Splash** — full-bleed green gradient (`#00CE86→#00C27C→#057A4E`), pulsing white rounded-square logo (heart-plus glyph), wordmark "CuraLink", tagline, "Made with care in Hyderabad". Auto-advances to Welcome after 2s (also tap-to-skip).
2. **Welcome carousel** — 3 value-prop slides (translateX track): "Care that comes home" / "Verified, every single one" / "For everyone you love (Amma, Appa, kids, even Simba)". Skip link, animated dots, Next→Get started.
3. **Login** — logo, "Welcome back", email + password (reveal) fields, forgot-password, primary Sign in, divider, "Continue with phone", footer to Signup. Prefilled `priya.nair@gmail.com`.
4. **Signup** — back, full name / **+91 mobile** / email / password, Continue → OTP, terms line, footer to Login.
5. **Phone verification (OTP)** — teal/navy icon, 4-box OTP that **auto-fills from "SMS"** (2·4·7·1 sequence, staggered), "Verify & continue" enables only when full, resend countdown.
6. **Care setup ("Who are you caring for?")** — eyebrow "One last thing", 2×2 multi-select cards: Myself / A parent / A child / A pet (check badge, tinted when selected). "Set up my home" → Home.

### B. Home & Booking
7. **Home / Dashboard** — greeting "Good morning, Priya ☀️", location row (Jubilee Hills), notification bell w/ unread dot. **RAPID-CARE HERO** (green gradient, "A nurse at your door within the hour", ~55 min ETA + no-slot badges, **"Book instantly — arrives ASAP"** one-tap → jumps straight to payment). **Active-visit card** (navy, live ETA, nurse, Track) shown instead when a visit is live. "Book a visit" 2-col service tiles (Nursing, Doctor, Physio, Vet, Lab, Elder). "Book again" recent providers with ratings. **"Your health, organized"** grid → Vitals / Care plan / Medical team / Lab reports / Insurance. Health-tip banner (monsoon tip). Has full **loading skeleton** variant.
8. **All services (Book tab)** — list of 6 categories with "from ₹" pricing.
9. **Service category detail** — green header (title + NABH/verified/same-day chips), "Choose a service" list with price + duration.
10–14. **Booking flow (5 steps, progress bar 1→5/5):**
    - **Step 1 Service** — radio list of sub-services w/ price+duration; Continue disabled until selected.
    - **Step 2 Who for** — family radio list (avatar, relationship, age) + "Add a family member". Copy note: "The professional sees their conditions & allergies before arriving."
    - **Step 3 Date & time** — horizontal day chips (Today/Tomorrow/…), 2-col time-slot grid (one shown **Full/disabled**), fasting tip.
    - **Step 4 Address** — address radio cards (Home/Parents'/Office w/ Hyderabad localities) + add-new + note field ("Ring the bell twice — Appa naps").
    - **Step 5 Summary & Pay** — **"Arrives within the hour" reassurance strip**, summary card (service/for/when/where), payment-method radios (UPI/Visa/Wallet/Pay-after), price breakdown (service + ₹49 fee − ₹100 CARE100 offer), Razorpay + refund note, pay button shows spinner while processing.
15. **Booking success** — green celebration, check, "You're all set 💛", provider-accepted card, **"On her way · arriving in ~55 min" live badge**, "Track the visit live" + back home.
    - **Payment-failed bottom sheet** — the **error state**: "Payment didn't go through … you haven't been charged", Retry / different method. (Prototype fails the FIRST payment attempt on purpose, succeeds on retry.)

### C. Live Visit Experience (hero — extra polish)
16. **Active visit tracking** — **real embedded Google Maps tile** (iframe in prototype; use Google Maps SDK in app) of Kondapur, with an **animated vehicle marker + pulsing destination pin** overlaid (pointer-transparent), floating back button + ETA card. Bottom sheet: nurse card (avatar, verified badge, rating→taps to Reviews, experience), call/message buttons, service/for/address strip, **arrival OTP code strip** (shown when arrived), **status timeline** (confirmed→accepted→on the way→arrived→in progress with live dot), "Start visit check-in". ETA animates 12→6→2 min then flips to **Arrived** (fires toast). *In production this needs the staff app's live GPS — see Shared Backend.*
17. **Visit in progress** — spinning ring around nurse avatar, "Meera is caring for {who}", started time + duration, typing dots, Message / "Mark visit complete".
18. **Visit completion (rate/tip/review)** — success check, star rating (tap to set), note textarea, tip chips (₹50/100/150/200), "Submit & finish" (enabled once rated) → returns Home + thank-you toast with tip.

### D. Profile & Family
19. **Profile home** — user card, **"Upgrade to Care Plus" dark upsell**, family & pets list (Priya/Rajesh/Meera/Aarav/Simba), Manage list → Medical team, Vitals, Insurance & claims, My reviews, Emergency contacts, Prescriptions, Help, Settings; Design-system reference link; Log out.
20. **Add/edit family member** — avatar, name, relationship, age, conditions, allergies, "View medical records", Save.
21. **Medical records** — conditions/allergies card + visit history for that member.
22. **Emergency contacts** — **"Book an ambulance" red banner** (→ Ambulance), contact list (Vaibhav/Sunita) with call buttons, add-contact, "not an emergency service, call 108" notice.

### E. History & Prescriptions
23. **Bookings list** — Upcoming/Past segmented tabs. Upcoming shows the live visit (or **empty state**). Past shows completed/cancelled with **status pills** + amounts.
24. **Past booking detail** — provider card, address/paid rows, price breakdown, view-prescription (if any), download-invoice, **Book again**.
25. **Prescriptions library** — list (viral fever/knee/diabetes) w/ doctor+date+med count.
26. **Prescription detail** — Rx-style card (doctor + reg no., patient, diagnosis, numbered medicines with dose/duration/notes, advice box), "Order these medicines" → Pharmacy, Download PDF.

### F. Wallet & Payments
27. **Wallet home** — green balance card + Add money, Payment-methods / Offers tiles, recent transactions (credits green, debits ink).
28. **Add money** — amount field (₹ hero), quick +₹500/1000/2000, UPI/card source, Add button (updates balance + toast).
29. **Payment methods** — UPI (default), cards, add-method.
30. **Transaction detail** — big amount, status check, date/reference/method rows, download receipt.

### G. Support & Settings
31. **Help center** — "Chat with care team" navy card, FAQ accordion (5 topics, expand/collapse chevron), call-support card.
32. **Chat support** — WhatsApp-style thread (Ananya, online), bubbles (me=green/right, them=white/left), typing indicator, input + send. Sending appends message, shows typing, then canned reply. **Reused as the second-opinion / medical-team message surface.**
33. **Settings** — Notifications (push, WhatsApp toggles), Preferences (language, **dark mode toggle**), Privacy & security (biometric toggle, privacy policy), Log out (resets to splash), version line. Toggles are teal pill switches.
34. **Notification center** — grouped notifications (visit/ok/wallet/star/tip) with unread dots, mark-all-read; visit notification taps into tracking.
35. **Design system reference** — in-app palette/type/button/field/pill/card/skeleton/empty/toast showcase (handy visual QA reference).

### Extended surfaces
36. **Vitals dashboard** — BP / blood sugar / SpO₂ / weight cards, each with value+unit, status pill, **SVG sparkline** (7-point series), "Log reading".
37. **Recovery / care plan** — navy assigned-doctor card + **vertical care timeline** (upcoming confirmed/pending + completed) with status pills.
38. **Insurance & claims** — green policy card (Star Health, ₹5,00,000 cover), "File a reimbursement claim" (pre-filled from invoice), claims list (approved/processing/submitted).
39. **Lab reports** — report library w/ Ready/Processing badges + download; **"Book a test" pill** → Book-a-lab-test.
40. **Book a lab test** — NABL strip, popular-tests catalog with **Add/Added toggle**, fasting flags, "Most booked" tag; **sample-pickup slot picker**; sticky footer with count + running total + "Book pickup · ₹total" → Bookings + toast.
41. **Pharmacy orders** — order list with status pills (out-for-delivery/delivered), items, ETA, amount. (Reached from Rx "Order these medicines".)
42. **Subscription plans** — 3 tiers **Care (free) / Care Plus (₹499/mo) / Family Plus (₹999/mo)**, selectable cards, "Most popular"/"Best value" badges, per-plan feature checklists, "Active" marker, sticky subscribe button (label adapts: current vs start/switch), no-lock-in note.
43. **Reviews & ratings** — 4.9 summary card + **5-bar rating distribution**, review cards (star row, service context, "You" badge, helpful count/tap), "Write a review" → completion flow.
44. **Ambulance booking** — SOS "call now" red banner, pickup card, 3 selectable ambulance types (BLS ₹1,299 / ALS ₹2,999 / transport ₹899) w/ ETA+price, "Dispatch ambulance now" → **live dispatched state** (pulsing ambulance, ETA, vehicle no., paramedic call, cancel).
47. **Provider profile** — navy header (verified avatar, name/role, rating·visits·experience stat row), About, specialty chips, verification checklist (licence / police check / skill assessment), recent reviews (→ Reviews). Sticky message + "Book {provider}". Reached from the nurse card on tracking and the first "Book again" provider on Home.
48. **Cura AI assistant** — personalised concierge chat that can act across the app (book visits, track orders, refill meds, pull records). Quick-action chips + free text; intent-aware canned replies with action confirmations. **Reached from a global floating button present on nearly every screen** (see §6) and a Home banner. In production this maps to an LLM tool-calling agent over the app's own APIs.
49. **Appointment reminders** — med/visit/vital reminders with time, cadence, and working on/off toggles (row dims when off).
50. **Diet & nutrition plan** — nutritionist-curated diabetic plan: navy header (kcal/day, meals, focus) + 5-meal timeline with kcal and tags + tip strip.
51. **Refer a friend** — "Give ₹300, get ₹300" hero, dashed referral-code card + copy, share button, 3-step how-it-works, earned/joined stat card.
52. **Home ICU setup** — navy hero ("A full ICU in your home in 4 hours", stats), equipment checklist (bed/oxygen/monitor/ventilator/pumps/suction), 3 selectable day-rate packages (Essential ₹4,999 / Complete ₹8,999 / + Intensivist ₹14,999), insurance-eligible note, sticky "Request setup · ₹…/day". Entry: dark banner atop All Services.
45. **Medical team** — coordinated team (care-lead doctor, nurse, physio, **24×7 care manager**) with online dot + message; **"Get a second opinion" navy card**; **"Complete history" grid** (records/prescriptions/labs/vitals — all shared with team); **recent-activity timeline** merging visits/labs/prescriptions.
46. **Second opinion** — private specialist consult: specialty grid picker, concern textarea, **auto-attached "3 records & 1 lab report from your history"** row, "Start secure consultation · ₹499" → chat. Copy: reply within 2 hours.

---

## 6. Interactions & Behavior (from the logic class)

- **Navigation:** `goTo(name, patch?)` sets `screen`, pushes previous onto `stack` (root tabs clear the stack); `back()` pops. Bottom nav switches root screens. Every back arrow works. Recreate with a native stack navigator; the 5 tabs are a bottom-tab navigator; modal/sheet screens (payment-failed) are presented modally.
- **Timers / demo automations** (replace with real events in prod):
  - Splash → Welcome after **2000ms**.
  - Home first-visit **skeleton for 1600ms** then content (`seenHome` gate).
  - OTP auto-fills 4 digits staggered (700ms + 380ms each).
  - Live visit ETA: 12→6 (4s) →2 (8s) → **Arrived (12s)** + toast.
- **Instant booking (USP):** `expressBook()` = `goTo('bookPay', {cat:'nurse', bkSvc:0, bkFor:1, bkDay:0, bkSlot:0})` — preselects nearest nurse, today, earliest window, skipping steps 1–4. Wire to a real "find nearest available provider now" backend call.
- **Payment:** first `pay()` attempt **fails** (opens payment-failed sheet) to demonstrate the error state; retry succeeds and confirms the booking. In prod, drive from Razorpay order + webhook result.
- **Booking confirm:** builds an `active` visit object and routes to success → track.
- **Rating submit:** clears active visit, returns Home, toast includes the chosen tip amount.
- **Chat send:** appends user msg, shows typing indicator ~1800ms, appends canned agent reply. Replace with real messaging.
- **Toggles / selections:** care-setup multi-select, plan select, ambulance-type select, lab-test cart add/remove, settings switches — all local state; persist server-side in prod.
- **Toasts:** 2.6s auto-dismiss; used for calls, downloads, saves, added-to-wallet, arrival, tip thanks.
- **Pressed feedback:** nearly every tappable uses `transform:scale(.96–.985)` on active.
- **Global Cura AI FAB:** a persistent floating button (navy pill, pulsing green ring, active-dot) opens the Cura assistant from anywhere. Shown on all screens EXCEPT splash/onboarding/auth, the assistant itself, and immersive flows (chat, live tracking, visit-in-progress, ambulance). Vertical offset is state-driven: `bottom:96px` on the 5 tab screens (clears bottom nav), `bottom:112px` on sticky-CTA screens (booking steps, completion, plans, lab booking, second opinion, provider profile, home ICU, **home-nursing subscription** — clears the primary button), `bottom:30px` elsewhere. Recreate as a global overlay component with a `hidden`/`offset` selector keyed off the active route.

### Extended surfaces (continued)
53. **Chronic care program** — year-round per-condition programs (Diabetes / Heart & BP / Post-stroke / Joint & mobility) with monthly price, "For {member}" tag on enrolled, Enroll/Enrolled toggle. Entry: "Chronic care" tile on Home health grid.
54. **Health checkup packages** — discounted lab packages (Essential ₹999 / Full body advanced ₹1,999 / Senior / Women's / Diabetes & heart) with was-price strikethrough + % off, parameter count, "Popular"/"Best value" tags, free-collection info strip. Entry: "Health checkups" tile on Home health grid.
55. **Home nursing subscription** — navy hero + 3 selectable monthly plans (Visiting nurse ₹11,999 / 12-hour attendant ₹27,999 / 24×7 live-in ₹44,999) with hours-per-day chips, sticky "Start plan · ₹…/mo". Entry: "Home nursing" tile on Home health grid.
56. **Give back / Donate** — urgent blood-request hero (hospital, distance, units), user blood-group eligibility card, and "Ways to give" list (blood donation, plasma, sponsor a home visit, donate equipment) with partner/NGO note. Entry: "Give back" tile on Home health grid.
57. **Video consultation** — navy hero + available-doctors list (online dot, specialty, rating, wait time, fee, video-call icon) and an "escalate to home visit" note; sticky "Talk to a doctor now". Entry: "Video consult" tile on Home health grid. In production: WebRTC/Twilio Video + digital-prescription generation.
58. **Pharmacy order (doctor-assigned Rx → order → delivery)** — shows the Rx **assigned by the doctor** after a visit, the fulfilling **partner pharmacy** + delivery ETA, an itemized prescribed-medicines list with per-item price, subtotal/delivery/total, "View past orders" link, and sticky "Place order · ₹total" → drops into pharmacy order history (screen 41) as out-for-delivery. Entry: "Order these medicines" on Prescription detail. This closes the loop: **doctor prescribes → Rx assigned to patient → patient orders → delivered** (see backend note below).
59. **Insurance card upload** — front/back card upload drop-zones, insurer + policy-number fields, encryption note; sticky "Save insurance card". Entry: "Upload insurance card" row on Insurance screen. (Sticky-CTA screen — FAB offset applied.)
60. **Loyalty rewards** — navy points card (Gold, 720 pts, progress-to-Platinum bar), tier row (Silver/Gold/Platinum), redeemable rewards list with Redeem/Locked states by points. Entry: "Rewards" tile on Home health grid.
61. **Health articles & tips** — featured article hero + categorized article list (monsoon/diabetes/child/heart/recovery) with read times. Entry: "Health tips" tile on Home health grid.
62. **Appointment calendar** — a week day-strip (event dots, selected day) + upcoming-events list (date chip + accent bar) aggregating visits, care-plan items and reminders. Entry: "Calendar" tile on Home health grid.

---

## 7. State Management

Prototype holds everything in one component's `state`. For production, split into:

- **Auth/session:** phone/email, OTP verification, JWT/session, current user.
- **Navigation state:** handled by the navigator (not app state).
- **Server data (React Query / RTK Query / Supabase queries):** user profile, family members, addresses, services & sub-services + pricing, providers, bookings (with live status), the active visit + provider live location, prescriptions, lab reports & lab-test catalog, vitals series, insurance policy + claims, wallet balance + transactions, pharmacy orders, subscription plan, reviews, notifications, chat threads/messages, medical-team roster, care-plan items.
- **Ephemeral UI state:** booking-flow selections (service/for/day/slot/address/payment method), lab-test cart, selected plan, ambulance type, form fields, toggles, toast.
- **Realtime subscriptions:** visit status + provider GPS (tracking), chat messages, notifications.

Key derived/selected values to mirror from `renderVals()`: status-pill style map, ETA label/sub, tab active styles, price breakdown math (`price + 49 − 100`), wallet formatting, spark-line point generation.

---

## 8. Shared Backend (⚠ most important — CuraLink + CuraLink Plus)

Both apps talk to **one backend, one database**. CuraLink (this app) is the **patient/family** client; **CuraLink Plus** (built next) is the **provider/staff** client. Design the API and schema now so Plus drops in without reshaping data.

### 8.1 Core entities (Postgres tables / Prisma models)
- `users` — id, name, email, phone (+91), password_hash/OTP auth, role (`patient` | `provider` | `admin`), created_at. **Both apps authenticate against this table; role gates which client/features.**
- `family_members` — id, owner_user_id, name, relationship, age, conditions, allergies, is_pet, avatar_color/initials.
- `addresses` — id, user_id, label, line, city/pincode, geo (lat/lng), note.
- `providers` — id, user_id (role=provider), specialty (nurse/doctor/physio/vet/lab/paramedic), display_name, reg_no, rating, visits_count, experience, verified flags (license/police/skill), **current live status (available/on_visit/offline)**, **current_location (lat/lng, updated_at)**.
- `services` / `sub_services` — category, name, description, price, duration, fasting flag, sub-service list per category (mirror `DATA.subServices`).
- `bookings` — id, patient_user_id, family_member_id, sub_service_id, address_id, provider_id (nullable until assigned), scheduled_window (or `express` flag for instant), **status enum** `pending→confirmed→en_route→in_progress→completed|cancelled`, amount breakdown (base, fee, discount, total), payment_id, arrival_otp, created_at. **This is the shared object the patient books and the provider fulfills.**
- `visit_events` — booking_id, type (confirmed/accepted/on_the_way/arrived/started/completed), timestamp, actor. Powers the patient timeline AND the provider's job steps.
- `provider_locations` — booking_id, provider_id, lat, lng, ts (stream). Patient app subscribes; Plus app publishes.
- `prescriptions` — id, booking_id, patient/family_member, doctor_provider_id, reg_no, diagnosis, meds[] (name/dose/duration/note), advice, pdf_url.
- `lab_orders` / `lab_reports` — tests[], pickup_window, status, params, lab_name, report_pdf_url, ready flag.
- `vitals` — family_member_id, type (bp/sugar/spo2/weight), value, unit, recorded_at (series).
- `insurance_policies` / `insurance_claims` — policy (provider, cover, used, number, valid_till); claims (booking_id, amount, status submitted/processing/approved).
- `wallet_accounts` / `wallet_transactions` — balance; txns (type, amount ±, ref, method, ts).
- `payment_methods` — user_id, type (upi/card), display, default flag. Payments via **Razorpay** (order + webhook + refund).
- `subscriptions` — user_id, plan (care/plus/family), status, renews_at.
- `reviews` — booking_id, provider_id, patient_user_id, stars, text, helpful_count.
- `pharmacy_orders` — from prescription, items, status, eta, amount.
- `ambulance_requests` — patient, pickup, type (bls/als/transport), status (requested/dispatched/…), vehicle_no, paramedic_provider_id, eta.
- `reminders` — user_id, family_member_id, type (med/visit/vital), title, time, cadence, enabled. Drives the reminders screen + push.
- `diet_plans` / `diet_meals` — family_member_id, nutritionist_provider_id, daily kcal target, focus; meals (slot, time, name, kcal, tags).
- `referrals` — referrer_user_id, code, referee_user_id, reward_amount, status; wallet credit on completion.
- `icu_setups` — patient/family, package tier, day-rate, equipment[], assigned nurse/intensivist, status; insurance-claim link.
- `chronic_programs` / `chronic_enrollments` — condition program (name, description, monthly price, included services); enrollment (family_member_id, program_id, status, next_review). Recurring monitoring + visits + reviews.
- `checkup_packages` / `checkup_orders` — package (name, params count, list_price, offer_price, focus); order reuses the `lab_orders` pickup flow.
- `nursing_subscriptions` — user/family, tier (visiting / 12-hr / 24×7 live-in), monthly price, hours/day, assigned nurse, status, renews_at.
- `donations` / `blood_requests` — donation (type: blood/plasma/fund/equipment, amount or slot, beneficiary, status); blood_requests (blood_group, hospital, geo, units_needed, urgency) matched to donors by group + proximity.
- `video_consults` — patient, doctor_provider_id, scheduled/instant, status, room token (WebRTC/Twilio), fee, generated prescription_id, follow-up-chat window.
- `pharmacy_orders` (extend) — links to source `prescription_id` and `assigned_by` doctor, fulfilling `pharmacy_id`, itemized lines (medicine, qty, price), delivery fee, status `assigned → ordered → out_for_delivery → delivered`. **Flow: the doctor (via CuraLink Plus) attaches a prescription/pharmacy assignment to a completed booking → it surfaces to the patient in CuraLink (Prescription detail → Order medicines) → patient places the order → pharmacy fulfils and status streams to delivered.** This is a shared-backend, both-apps object like bookings.
- `insurance_cards` — user_id, insurer, policy_number, front/back image URLs (encrypted), verified flag; used to auto-file claims.
- `loyalty_accounts` / `loyalty_redemptions` — points balance, tier (silver/gold/platinum), earn rules; redemptions (reward_id, points_spent, status). Points earned per booking.
- `articles` — health content (category, title, body, read_time, image); editorial, read-only to the app.
- Appointment **calendar** is a client view aggregating `bookings` + `care_plan_items` + `reminders` by date — no new table needed.
- `assistant_threads` / `assistant_messages` — the Cura AI concierge conversation; in production Cura is an **LLM tool-calling agent** whose tools are the app's own endpoints (create booking, refill Rx, fetch records, etc.) — scope its tools to the authenticated patient.
- `care_teams` / `care_team_members` — links a patient/family to their assigned providers + care manager (powers "Medical team").
- `care_plans` / `care_plan_items` — scheduled recurring care (physio sessions etc.).
- `chat_threads` / `chat_messages` — patient↔care-team/second-opinion; sender, body, ts, attachments. **Plus app is the staff side of the same threads.**
- `notifications` — user_id, kind, title, body, read, ts.

### 8.2 Which app writes what (so the shared model is unambiguous)
| Domain | CuraLink (patient) | CuraLink Plus (staff) |
|---|---|---|
| Bookings | creates, cancels, rates | accepts, advances status, completes |
| Visit status/timeline | reads (subscribe) | writes `visit_events` |
| Live location | reads (subscribe) | **publishes GPS** |
| Prescriptions | reads | doctor creates |
| Lab reports | reads/downloads | lab uploads |
| Chat | patient messages | staff replies |
| Vitals | family logs | provider records during visit |
| Reviews | writes | reads (their rating) |
| Ambulance | requests | paramedic accepts/updates |

### 8.3 Realtime
Use **WebSocket / Supabase Realtime / Firebase**: (1) booking status + `visit_events`, (2) `provider_locations` stream for the live map, (3) chat messages, (4) notifications/push (FCM). The live-tracking screen in this app is the **consumer** of a GPS stream that the **Plus app produces** — build the channel contract now.

### 8.4 Notable API endpoints (suggested)
`POST /auth/otp`, `POST /auth/verify`; `GET /me`, `family`, `addresses`; `GET /services`; `POST /bookings` (+ `express: true` for instant → server finds nearest available provider); `GET /bookings/:id` + realtime; `POST /bookings/:id/rate`; `GET /prescriptions|lab-reports|vitals|claims|wallet|transactions|subscriptions|reviews|notifications|care-team|chat`; `POST /payments/order` + Razorpay webhook; `POST /ambulance` + realtime; `POST /lab-orders`; `POST /second-opinion`.

---

## 9. Assets
- **Fonts:** Bricolage Grotesque + Inter (Google Fonts; DM Serif Display loaded but reserved). Bundle via `expo-font` / native font files.
- **Icons:** Feather/Lucide line set — use `lucide-react-native`. All icons in the prototype are inline SVG paths; map to Lucide equivalents (heart-plus, home, calendar, wallet, user, map-pin, phone, message-square, star, shield, activity, flask/lab, ambulance, zap, etc.).
- **Illustrations:** none — the design is icon + type driven (intentional). No raster art to extract.
- **Map:** Google Maps (prototype uses a keyless embed of Kondapur, Hyderabad; production needs a Maps API key + provider GPS).
- **Flags/emoji:** 🇮🇳 for +91 prefix; a few emoji in copy and specialty picker (kept minimal, brand-consistent).
- **Content:** all names/addresses/prices are realistic Indian content (Priya, Rajesh, Meera, Aarav, Simba; Jubilee Hills/Kondapur/Madhapur; ₹ Indian grouping). Safe to reuse as seed data.

## 10. Files in this bundle
- `screenshots/` — **35 reference PNGs** of key screens (onboarding → booking → live tracking → completion, plus profile, wallet, vitals, medical team, Cura AI, home ICU, plans, ambulance, reviews, design system, video consult, pharmacy order + history, chronic care, health checkups, home nursing, donate, insurance-card upload, loyalty rewards, health articles, appointment calendar). Named by screen. Note: the live-tracking shot shows the marker/ETA overlays but not the Google map tile (iframes aren't captured) — see the prototype for the live map.
- `CuraLink.dc.html` — **the canonical prototype** (green/navy theme, all 40+ screens). Primary reference.
- `CuraLink Coral v1.dc.html` — earlier coral-theme version. **Reference only / alternate palette; do not build from it.**
- `ios-frame.jsx`, `support.js` — prototype scaffolding (device bezel + DC runtime). **Not part of the product**; ignore for implementation.
- `README.md` — this document (self-sufficient).

## 11. Implementation order (suggested)
1. Backend schema + auth (OTP) + seed data.
2. Design tokens + component library (buttons, fields, cards, pills, nav, sheet, toast, skeleton).
3. Onboarding/auth → Home shell + bottom nav.
4. Booking flow + **instant/express booking** + Razorpay.
5. **Live visit tracking + realtime + provider-GPS contract** (coordinate with CuraLink Plus).
6. Profile/family, history, prescriptions, wallet.
7. Extended: vitals, care plan, insurance, labs + book-a-test, pharmacy, plans, reviews, ambulance, medical team, second opinion.
8. Support/settings/notifications, dark mode.
