const CATEGORY_LABELS: Record<string, string> = {
  nurse: "Nursing care",
  doctor: "Doctor consult",
  physio: "Physiotherapy",
  vet: "Vet care",
  pediatric: "Pediatric care",
  lab: "Lab & checkups",
  elder: "Elder care",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
