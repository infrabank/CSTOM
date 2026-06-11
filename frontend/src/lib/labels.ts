/**
 * Domain label / color / option constants shared across (admin) pages.
 *
 * Conventions:
 *  - `*_LABELS`  : Record<string, string>  — code -> Korean display text
 *  - `*_COLORS`  : Record<string, string>  — code -> Tailwind badge classes
 *  - `*_OPTIONS` : { value, label }[]       — for <select>/filter inputs
 *
 * On label/color conflicts between pages, the value used on the domain's own
 * LIST page is kept (see final report for the specific conflicts).
 *
 * Helpers `labelOf` / `colorOf` provide safe fallbacks.
 */

export interface SelectOption {
  value: string;
  label: string;
}

export function labelOf(
  map: Record<string, string>,
  key: string | null | undefined,
): string {
  if (key == null) return "-";
  return map[key] ?? key;
}

export function colorOf(
  map: Record<string, string>,
  key: string | null | undefined,
  fallback = "bg-surface-sunken text-text-muted",
): string {
  if (key == null) return fallback;
  return map[key] ?? fallback;
}

/** Builds an options array from a labels map (insertion order preserved). */
export function optionsFromLabels(map: Record<string, string>): SelectOption[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }));
}

// ---------------------------------------------------------------------------
// Contract status (source of truth: contracts/page.tsx)
// ---------------------------------------------------------------------------

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  "pre-handover": "인수 전",
  handover: "인수",
  stabilization: "안정화",
  steady: "정상 운영",
  closed: "종료",
};

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  "pre-handover": "bg-warning-bg text-warning",
  handover: "bg-info-bg text-info",
  stabilization: "bg-accent-light text-accent",
  steady: "bg-success-bg text-success",
  closed: "bg-surface-sunken text-text-muted",
};

export const CONTRACT_STATUS_OPTIONS: SelectOption[] = optionsFromLabels(
  CONTRACT_STATUS_LABELS,
);

export const CONTRACT_SCOPE_LABELS: Record<string, string> = {
  operation: "운영",
  construction: "구축",
  transition: "전환",
  pm: "PM",
};

// ---------------------------------------------------------------------------
// Task type / impact / approval (source of truth: tasks/page.tsx)
// ---------------------------------------------------------------------------

export const TASK_TYPE_LABELS: Record<string, string> = {
  routine: "정기",
  incident: "장애",
  change: "변경",
  request: "요청",
};

export const TASK_TYPE_COLORS: Record<string, string> = {
  routine: "bg-surface-sunken text-text",
  incident: "bg-danger-bg text-danger",
  change: "bg-info-bg text-accent",
  request: "bg-accent-light text-accent",
};

export const TASK_IMPACT_LABELS: Record<string, string> = {
  none: "없음",
  partial: "부분",
  full: "전체",
};

export const TASK_IMPACT_COLORS: Record<string, string> = {
  none: "bg-surface-sunken text-text",
  partial: "bg-warning-bg text-warning",
  full: "bg-danger-bg text-danger",
};

export const TASK_APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_required: "-",
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

export const TASK_APPROVAL_STATUS_COLORS: Record<string, string> = {
  not_required: "text-text-muted",
  pending: "bg-warning-bg text-warning",
  approved: "bg-success-bg text-success",
  rejected: "bg-danger-bg text-danger",
};

// ---------------------------------------------------------------------------
// Event type / severity (source of truth: events/page.tsx + events/[eventId])
// ---------------------------------------------------------------------------

export const EVENT_TYPE_LABELS: Record<string, string> = {
  change: "변경",
  incident: "장애",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  change: "bg-info-bg text-accent",
  incident: "bg-danger-bg text-danger",
};

export const EVENT_SEVERITY_LABELS: Record<number, string> = {
  1: "심각도 1 (서비스 전면중단)",
  2: "심각도 2 (주요기능 장애)",
  3: "심각도 3 (경미한 장애)",
};

export const EVENT_SEVERITY_COLORS: Record<number, string> = {
  1: "bg-danger-bg text-danger",
  2: "bg-warning-bg text-warning",
  3: "bg-surface-sunken text-text-secondary",
};

export const EVENT_SEVERITY_OPTIONS: SelectOption[] = [
  { value: "1", label: "심각도 1 (서비스 전면중단)" },
  { value: "2", label: "심각도 2 (주요기능 장애)" },
  { value: "3", label: "심각도 3 (경미한 장애)" },
];

// ---------------------------------------------------------------------------
// Equipment category / status (source of truth: equipments/page.tsx)
// ---------------------------------------------------------------------------

export const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  server: "서버",
  network: "네트워크",
  storage: "스토리지",
  security: "보안장비",
  pc: "PC",
  other: "기타",
};

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  available: "보관중",
  checked_out: "반출중",
  maintenance: "점검중",
  retired: "폐기",
};

export const EQUIPMENT_STATUS_COLORS: Record<string, string> = {
  available: "bg-success-bg text-success",
  checked_out: "bg-danger-bg text-danger",
  maintenance: "bg-warning-bg text-warning",
  retired: "bg-surface-sunken text-text",
};

export const EQUIPMENT_STATUS_OPTIONS: SelectOption[] = optionsFromLabels(
  EQUIPMENT_STATUS_LABELS,
);

export const EQUIPMENT_CATEGORY_OPTIONS: SelectOption[] = optionsFromLabels(
  EQUIPMENT_CATEGORY_LABELS,
);

// ---------------------------------------------------------------------------
// Ticket priority / status (source of truth: tickets/page.tsx + edit page)
// ---------------------------------------------------------------------------

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  critical: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const TICKET_PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger",
  high: "bg-warning-bg text-warning",
  medium: "bg-warning-bg text-warning",
  low: "bg-success-bg text-success",
};

export const TICKET_PRIORITY_OPTIONS: SelectOption[] = [
  { value: "low", label: "낮음" },
  { value: "medium", label: "보통" },
  { value: "high", label: "높음" },
  { value: "critical", label: "긴급" },
];

export const TICKET_STATUS_COLORS: Record<string, string> = {
  open: "bg-info-bg text-accent",
  in_progress: "bg-accent-light text-accent",
  resolved: "bg-success-bg text-success",
  closed: "bg-surface-sunken text-text-muted",
};

export const TICKET_STATUS_OPTIONS: SelectOption[] = [
  { value: "new", label: "신규" },
  { value: "open", label: "접수" },
  { value: "in_progress", label: "처리중" },
  { value: "waiting", label: "대기" },
  { value: "resolved", label: "해결" },
  { value: "closed", label: "종료" },
];

// ---------------------------------------------------------------------------
// SLA grade + definition priority (sources: sla/evaluations, sla/page)
// ---------------------------------------------------------------------------

export const SLA_GRADE_COLORS: Record<string, string> = {
  S: "bg-success-bg text-success",
  A: "bg-info-bg text-accent",
  B: "bg-warning-bg text-warning",
  C: "bg-danger-bg text-danger",
  D: "bg-danger-bg text-danger",
};

export const SLA_PRIORITY_LABELS: Record<string, string> = {
  critical: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const SLA_PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-danger-bg text-danger",
  high: "bg-warning-bg text-warning",
  medium: "bg-info-bg text-accent",
  low: "bg-surface-sunken text-text-muted",
};

// ---------------------------------------------------------------------------
// Inspection schedule cycle + task status (sources: inspections pages)
// ---------------------------------------------------------------------------

export const INSPECTION_CYCLE_LABELS: Record<string, string> = {
  monthly: "월간",
  quarterly: "분기",
  biannual: "반기",
  annual: "연간",
};

export const INSPECTION_CYCLE_COLORS: Record<string, string> = {
  monthly: "bg-info-bg text-accent",
  quarterly: "bg-accent-light text-accent",
  biannual: "bg-success-bg text-success",
  annual: "bg-warning-bg text-warning",
};

export const INSPECTION_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
};

export const INSPECTION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-bg text-warning",
  in_progress: "bg-info-bg text-info",
  completed: "bg-success-bg text-success",
};

// ---------------------------------------------------------------------------
// User status / role (source of truth: users/page.tsx)
// ---------------------------------------------------------------------------

export const USER_STATUS_LABELS: Record<string, string> = {
  active: "활성",
  inactive: "비활성",
};

export const USER_STATUS_COLORS: Record<string, string> = {
  active: "bg-success-bg text-success",
  inactive: "bg-surface-sunken text-text",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  pm: "PM",
  engineer: "엔지니어",
  customer: "고객",
};

export const USER_ROLE_COLORS: Record<string, string> = {
  admin: "bg-danger-bg text-danger",
  pm: "bg-info-bg text-info",
  engineer: "bg-info-bg text-info",
  customer: "bg-warning-bg text-warning",
};

// ---------------------------------------------------------------------------
// Report type (source of truth: reports/page.tsx)
// ---------------------------------------------------------------------------

export const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly: "월간 보고서",
  incident: "장애 보고서",
  audit: "감사 보고서",
};

export const REPORT_TYPE_COLORS: Record<string, string> = {
  monthly: "bg-info-bg text-info",
  incident: "bg-danger-bg text-danger",
  audit: "bg-info-bg text-info",
};
