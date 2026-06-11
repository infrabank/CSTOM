import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Generic, reusable list renderer that produces BOTH the desktop `<table>`
 * (hidden on mobile) and the mobile card stack from a single column
 * definition. Pure render component — safe to use in server and client
 * components (no hooks, no "use client").
 */

export interface Column<T> {
  /** Unique key for the column (used as React key and mobile label fallback). */
  key: string;
  /** Header cell content. */
  header: ReactNode;
  /** Optional className applied to the `<th>` and `<td>` (e.g. text-right). */
  className?: string;
  /** Custom cell renderer. Falls back to `String(row[key])` when omitted. */
  render?: (row: T) => ReactNode;
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Returns a stable React key for a row. */
  rowKey: (row: T) => string | number;
  /** Message shown when `rows` is empty (desktop + mobile). */
  emptyMessage: ReactNode;
  /** Optional per-row link target. When set, mobile cards wrap in a Link. */
  rowHref?: (row: T) => string;
  /**
   * Custom mobile card renderer. When omitted, a card is auto-generated from
   * the columns (header label + rendered value rows).
   */
  renderMobileCard?: (row: T) => ReactNode;
  /** Optional extra className for the desktop table wrapper. */
  className?: string;
}

const TH_CLASS =
  "px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider";

function defaultCell<T>(column: Column<T>, row: T): ReactNode {
  if (column.render) return column.render(row);
  const value = (row as Record<string, unknown>)[column.key];
  return value == null ? "" : String(value);
}

export default function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  rowHref,
  renderMobileCard,
  className,
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop table */}
      <div
        className={`hidden md:block bg-surface shadow-card rounded-lg overflow-hidden border border-border-light${
          className ? ` ${className}` : ""
        }`}
      >
        <table className="min-w-full divide-y divide-border-light">
          <thead className="bg-surface-sunken">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={
                    column.className ? `${TH_CLASS} ${column.className}` : TH_CLASS
                  }
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border-light">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-surface-sunken transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={
                        column.className
                          ? `px-6 py-4 ${column.className}`
                          : "px-6 py-4"
                      }
                    >
                      {defaultCell(column, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="bg-surface p-6 rounded-lg shadow-card border border-border-light text-center text-text-muted">
            {emptyMessage}
          </div>
        ) : (
          rows.map((row) => {
            const card = renderMobileCard ? (
              renderMobileCard(row)
            ) : (
              <DefaultMobileCard columns={columns} row={row} />
            );
            const href = rowHref?.(row);
            return (
              <div key={rowKey(row)}>
                {href ? <Link href={href}>{card}</Link> : card}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function DefaultMobileCard<T>({
  columns,
  row,
}: {
  columns: Column<T>[];
  row: T;
}) {
  return (
    <div className="bg-surface rounded-lg shadow-card border border-border-light p-4 space-y-2">
      {columns.map((column) => (
        <div key={column.key} className="flex justify-between gap-3 text-sm">
          <span className="font-medium text-text-secondary">{column.header}</span>
          <span className="text-text text-right">{defaultCell(column, row)}</span>
        </div>
      ))}
    </div>
  );
}
