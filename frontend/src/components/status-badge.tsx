import type { ReactNode } from "react";

/**
 * Small pill badge used across list/detail pages. Pure render component —
 * safe in server and client components.
 *
 * Pass an explicit `colorClass` (e.g. "bg-success-bg text-success"), or look
 * the class up from a map in @/lib/labels. Falls back to a neutral style.
 */

export interface StatusBadgeProps {
  label: ReactNode;
  /** Tailwind color classes, e.g. "bg-success-bg text-success". */
  colorClass?: string;
  /** Visual size. "md" matches the table-cell badge, "sm" the compact one. */
  size?: "sm" | "md";
}

const FALLBACK_COLOR = "bg-surface-sunken text-text-muted";

export default function StatusBadge({
  label,
  colorClass,
  size = "md",
}: StatusBadgeProps) {
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2 py-1";
  return (
    <span
      className={`${padding} rounded-full text-xs font-medium ${
        colorClass || FALLBACK_COLOR
      }`}
    >
      {label}
    </span>
  );
}
