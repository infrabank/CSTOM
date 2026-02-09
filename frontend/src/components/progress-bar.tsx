"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Lightweight top-of-page progress bar for Next.js App Router.
 * Uses direct DOM manipulation to avoid React 19 setState-in-effect lint errors.
 */
export default function AppProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPathRef = useRef<string>("");

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    const bar = barRef.current;
    const container = containerRef.current;
    if (!bar || !container) return;

    container.style.opacity = "1";
    bar.style.transition = "none";
    bar.style.width = "0%";

    // Force reflow
    bar.offsetWidth; // eslint-disable-line @typescript-eslint/no-unused-expressions

    bar.style.transition = "width 200ms ease-out";
    let current = 0;
    timerRef.current = setInterval(() => {
      current += (90 - current) * 0.1;
      bar.style.width = `${current}%`;
      if (current >= 89) clearTimer();
    }, 100);
  }, [clearTimer]);

  const done = useCallback(() => {
    clearTimer();
    const bar = barRef.current;
    const container = containerRef.current;
    if (!bar || !container) return;

    bar.style.transition = "width 200ms ease-out";
    bar.style.width = "100%";
    setTimeout(() => {
      container.style.opacity = "0";
      setTimeout(() => {
        bar.style.transition = "none";
        bar.style.width = "0%";
      }, 200);
    }, 200);
  }, [clearTimer]);

  // Route change detection: when pathname/searchParams change, navigation is done
  useEffect(() => {
    const key = `${pathname}?${searchParams?.toString() ?? ""}`;
    if (prevPathRef.current && key !== prevPathRef.current) {
      done();
    }
    prevPathRef.current = key;
  }, [pathname, searchParams, done]);

  // Intercept link clicks to start progress bar before navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !anchor.hasAttribute("download") &&
        anchor.target !== "_blank"
      ) {
        if (href !== pathname) {
          start();
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, start]);

  // Cleanup on unmount
  useEffect(() => clearTimer, [clearTimer]);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      style={{ opacity: 0, transition: "opacity 200ms" }}
      role="progressbar"
    >
      <div
        ref={barRef}
        className="h-full bg-[#2563eb]"
        style={{ width: "0%" }}
      />
    </div>
  );
}
