/**
 * Shared SLA evaluation grade/score business logic for the evaluation pages
 * (new, [reportId], [reportId]/edit). Single source of truth for the grade
 * thresholds and the service-level select options.
 */

export interface GradeInfo {
  grade: string;
  label: string;
}

/** Maps a total score (0-100) to its grade + Korean label. */
export function getGradeInfo(score: number): GradeInfo {
  if (score >= 96) return { grade: "S", label: "탁월" };
  if (score >= 90) return { grade: "A", label: "우수" };
  if (score >= 85) return { grade: "B", label: "보통" };
  if (score >= 80) return { grade: "C", label: "최저" };
  return { grade: "D", label: "불가" };
}

export const SERVICE_LEVEL_OPTIONS = [
  { value: "1.0", label: "1.0 (목표이상)" },
  { value: "0.8", label: "0.8 (최소이상)" },
  { value: "0.6", label: "0.6 (최소미만)" },
  { value: "0.4", label: "0.4 (미흡)" },
  { value: "0.2", label: "0.2 (매우미흡)" },
];
