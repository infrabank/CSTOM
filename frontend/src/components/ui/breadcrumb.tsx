"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "대시보드",
  contracts: "사업관리",
  tasks: "작업관리",
  inspections: "예방점검",
  events: "변경/장애",
  tickets: "티켓",
  workforce: "인력관리",
  sop: "SOP",
  sla: "SLA",
  kb: "지식베이스",
  reports: "보고서",
  equipments: "장비관리",
  users: "사용자",
  predictions: "AI 예측",
  scan: "QR 스캔",
  schedule: "일정관리",
  new: "신규",
  edit: "수정",
};

function isNumericSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: { label: string; href: string }[] = [
    { label: "홈", href: "/dashboard" },
  ];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = isNumericSegment(segment)
      ? "상세"
      : ROUTE_LABELS[segment] || segment;
    crumbs.push({ label, href: currentPath });
  }

  // Don't show breadcrumb if only at top-level (e.g., /dashboard)
  if (crumbs.length <= 2 && segments.length <= 1) return null;

  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1.5 text-sm text-text-muted">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {index > 0 && (
                <svg className="w-3.5 h-3.5 text-border-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
              {isLast ? (
                <span className="font-medium text-text">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-accent transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
