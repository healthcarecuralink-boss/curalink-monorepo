export interface HealthArticle {
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
}

export const healthArticles: HealthArticle[] = [
  {
    slug: "monsoon-joint-care",
    title: "Monsoon joint care for elders",
    summary: "Why humidity worsens stiffness, and simple daily habits that help.",
    category: "Elder care",
    body: "Humidity and sudden temperature drops during monsoon can worsen joint stiffness for elders, especially those with arthritis. A short 10-minute morning stretch, staying warm and dry, and gentle joint mobility exercises can meaningfully reduce discomfort. If stiffness is paired with swelling or fever, book a physio or nurse home visit rather than waiting it out.",
  },
  {
    slug: "home-visit-vitals",
    title: "What your nurse checks during a home visit",
    summary: "A walkthrough of the standard vitals panel recorded on every visit.",
    category: "Home care",
    body: "Every CuraLink home visit records a standard set of vitals — blood pressure, pulse, oxygen saturation, temperature, and blood sugar where relevant. These are logged directly to your Vitals dashboard so you and your family can track trends over time, not just a single reading.",
  },
  {
    slug: "when-to-call-ambulance",
    title: "When to call an ambulance vs. book a visit",
    summary: "A quick guide to BLS vs ALS, and what counts as a true emergency.",
    category: "Emergency",
    body: "BLS (Basic Life Support) ambulances are appropriate for stable patients who need safe transport — post-surgery discharge, mobility-limited transfers, or non-critical transport between facilities. ALS (Advanced Life Support) ambulances carry advanced equipment and trained crew for time-critical emergencies: chest pain, breathing difficulty, major trauma, or loss of consciousness. When in doubt, use the SOS button — it always dispatches the nearest available ALS unit.",
  },
  {
    slug: "medication-adherence",
    title: "Why medication adherence matters after a visit",
    summary: "Small habits that make it far more likely a prescribed course gets finished.",
    category: "Medication",
    body: "Missed doses are one of the most common reasons a condition doesn't improve as expected. Setting a fixed time of day, keeping medicines somewhere visible, and using the Pharmacy orders tracker to know exactly when a refill is arriving all meaningfully improve adherence for ongoing courses.",
  },
];
