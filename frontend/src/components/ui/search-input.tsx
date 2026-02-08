"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useCallback } from "react";

interface SearchInputProps {
  placeholder?: string;
  paramName?: string;
}

export default function SearchInput({
  placeholder = "검색...",
  paramName = "search",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(paramName) || "");

  const updateSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set(paramName, term);
      } else {
        params.delete(paramName);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams, paramName]
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          updateSearch(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 pl-10 border border-border rounded-md bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-3 focus:ring-accent/30 focus:border-accent transition-colors"
      />
      <svg
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
          isPending ? "text-accent animate-pulse" : "text-text-muted"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}
