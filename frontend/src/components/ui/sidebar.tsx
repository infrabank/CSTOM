"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { authApi } from "@/lib/api";
import Modal from "@/components/modal";

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "operations",
    label: "운영관리",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
    items: [
      { label: "사업관리", href: "/contracts" },
      { label: "작업관리", href: "/tasks" },
      { label: "예방점검", href: "/inspections" },
      { label: "변경/장애", href: "/events" },
      { label: "티켓", href: "/tickets" },
      { label: "인력관리", href: "/workforce" },
      { label: "사용매뉴얼", href: "/guide" },
    ],
  },
  {
    id: "sla",
    label: "SLA관리",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    items: [
      { label: "SLA 정의", href: "/sla" },
      { label: "SLA 평가", href: "/sla/evaluations" },
      { label: "배점기준", href: "/sla/criteria" },
      { label: "가동율 관리", href: "/sla/uptime" },
      { label: "벌점 관리", href: "/sla/penalties" },
      { label: "성능개선", href: "/sla/improvements" },
      { label: "개정요청", href: "/sla/revisions" },
      { label: "사용매뉴얼", href: "/sla/manual" },
    ],
  },
  {
    id: "documents",
    label: "문서관리",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    items: [
      { label: "SOP", href: "/sop" },
      { label: "지식베이스", href: "/kb" },
      { label: "보고서", href: "/reports" },
    ],
  },
  {
    id: "system",
    label: "시스템",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    items: [
      { label: "장비관리", href: "/equipments" },
      { label: "사용자", href: "/users" },
      { label: "AI 예측", href: "/predictions" },
      { label: "알림", href: "/notifications" },
      { label: "감사로그", href: "/audit" },
      { label: "QR 스캔", href: "/scan" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  SidebarLayout - wraps admin content with sidebar + mobile bar      */
/* ------------------------------------------------------------------ */

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("cstom-sidebar-expanded");
    return saved !== null ? saved === "true" : true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // User-toggled groups (manual expand/collapse)
  const [toggledGroups, setToggledGroups] = useState<Set<string>>(new Set(["operations", "sla", "documents", "system"]));
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Merge user-toggled groups with active-route groups (active route always visible)
  const expandedGroups = useMemo(() => {
    const merged = new Set(toggledGroups);
    for (const group of NAV_GROUPS) {
      if (group.items.some((item) => pathname.startsWith(item.href))) {
        merged.add(group.id);
      }
    }
    return merged;
  }, [toggledGroups, pathname]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      localStorage.setItem("cstom-sidebar-expanded", String(next));
      return next;
    });
  }, []);

  const toggleGroup = useCallback((groupId: string) => {
    setToggledGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authApi.logout();
    router.push("/login");
  };

  // Close mobile drawer on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) closeMobile();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, closeMobile]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  /* ---- Shared sidebar content ---- */
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border-light shrink-0">
        {isExpanded ? (
          <Link href="/dashboard" className="flex items-center gap-2" onClick={closeMobile}>
            <Image src="/images/ci_21.jpg" alt="KRIHS 국토연구원" width={140} height={31} priority className="h-8 w-auto" />
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto" onClick={closeMobile} title="KRIHS 국토연구원">
            <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-text-on-accent font-bold text-sm">K</div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="사이드바 내비게이션">
        {/* Dashboard - top level */}
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className={`flex items-center gap-3 px-3 h-11 rounded-md mb-1 transition-colors cursor-pointer ${
            isActive("/dashboard")
              ? "bg-accent-light text-accent border-l-3 border-accent font-medium"
              : "text-text-secondary hover:bg-surface-hover"
          }`}
          title={!isExpanded ? "대시보드" : undefined}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
          {isExpanded && <span>대시보드</span>}
        </Link>

        {/* Nav groups */}
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mt-2">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className={`flex items-center w-full gap-3 px-3 h-9 rounded-md text-left transition-colors cursor-pointer ${
                isExpanded ? "hover:bg-surface-hover" : "justify-center"
              }`}
              title={!isExpanded ? group.label : undefined}
              aria-expanded={expandedGroups.has(group.id)}
            >
              <span className="text-text-muted shrink-0">{group.icon}</span>
              {isExpanded && (
                <>
                  <span className="text-xs uppercase font-semibold text-text-muted tracking-wider flex-1">
                    {group.label}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-text-muted transition-transform ${expandedGroups.has(group.id) ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </>
              )}
            </button>

            {/* Group items */}
            {(isExpanded ? expandedGroups.has(group.id) : false) && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center h-10 rounded-md transition-colors cursor-pointer ${
                      isExpanded ? "pl-11 pr-3" : "justify-center px-2"
                    } ${
                      isActive(item.href)
                        ? "bg-accent-light text-accent border-l-3 border-accent font-medium"
                        : "text-text-secondary hover:bg-surface-hover"
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <span className="text-sm">{isExpanded ? item.label : item.label.charAt(0)}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Collapsed mode: show items as a column when group is not expandable */}
            {!isExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className={`flex items-center justify-center h-9 w-full rounded-md transition-colors cursor-pointer text-xs ${
                      isActive(item.href)
                        ? "bg-accent-light text-accent font-medium"
                        : "text-text-muted hover:bg-surface-hover"
                    }`}
                    title={item.label}
                  >
                    {item.label.charAt(0)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border-light px-2 py-3 shrink-0 space-y-1">
        {/* Collapse toggle - desktop only */}
        <button
          onClick={toggleExpanded}
          className="hidden md:flex items-center gap-3 w-full px-3 h-10 rounded-md text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
          title={isExpanded ? "사이드바 접기" : "사이드바 펼치기"}
        >
          <svg
            className={`w-5 h-5 shrink-0 transition-transform ${isExpanded ? "" : "rotate-180"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
          {isExpanded && <span className="text-sm">접기</span>}
        </button>

        {/* Logout */}
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className={`flex items-center gap-3 w-full px-3 h-10 rounded-md text-danger hover:bg-danger-bg transition-colors cursor-pointer ${!isExpanded ? "justify-center" : ""}`}
          title={!isExpanded ? "로그아웃" : undefined}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          {isExpanded && <span className="text-sm">로그아웃</span>}
        </button>
      </div>

      {/* Logout modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="로그아웃"
        footer={
          <>
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 border border-border rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
              disabled={isLoggingOut}
            >
              취소
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-danger text-text-on-primary rounded-md hover:opacity-90 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </button>
          </>
        }
      >
        <p>로그아웃 하시겠습니까?</p>
      </Modal>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-surface-raised">
      {/* Desktop sidebar */}
      <aside
        data-sidebar
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen bg-surface border-r border-border-light z-40 transition-all duration-200 print:hidden ${
          isExpanded ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-collapsed-width)]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* Mobile drawer */}
      <aside
        data-sidebar
        className={`md:hidden fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-border-light z-50 transition-transform duration-200 print:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Content area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 print:ml-0 ${
          isExpanded ? "md:ml-[var(--sidebar-width)]" : "md:ml-[var(--sidebar-collapsed-width)]"
        }`}
      >
        {/* Mobile top bar */}
        <div className="md:hidden h-14 bg-surface border-b border-border-light flex items-center px-4 sticky top-0 z-30 print:hidden">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-md text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="메뉴 열기"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="ml-3 font-semibold text-text">CSTOM</span>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
