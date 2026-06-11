import path from "node:path";

/**
 * Shared e2e constants and helpers.
 *
 * Tests run against the REAL local Django backend (port 8000) and the Next.js
 * dev server (port 3000). Both are started by Playwright's `webServer` config.
 *
 * Admin credentials match the seeded local superuser (see backend seed_admin).
 */
export const ADMIN_EMAIL = "admin@local.dev";
export const ADMIN_PASSWORD = "localdev123";

/** Persisted browser session (cookies) produced by global-setup. */
export const STORAGE_STATE = path.join(__dirname, ".auth", "admin.json");

/**
 * Admin list routes that should render a heading + table (or empty-state),
 * never the error boundary. Each entry: [path, expected heading text].
 */
export const SMOKE_ROUTES: ReadonlyArray<readonly [string, string]> = [
  ["/dashboard", "대시보드"],
  ["/contracts", "사업 관리"],
  ["/tasks", "작업 관리"],
  ["/events", "변경/장애 관리"],
  ["/equipments", "장비 반출입 관리"],
  ["/tickets", "티켓 관리"],
  ["/kb", "지식베이스"],
  ["/sop", "SOP 관리"],
  ["/sla", "SLA 정의"],
  ["/inspections", "점검 스케줄 관리"],
  ["/reports", "보고서"],
  ["/users", "사용자 관리"],
  ["/notifications", "알림"],
];

/** Text shown by the (admin)/error.tsx error boundary. */
export const ERROR_BOUNDARY_TEXT = "오류가 발생했습니다";
