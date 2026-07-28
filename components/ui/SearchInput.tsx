"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

type SearchInputProps = {
  value?: string;
  defaultValue?: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
  autoFocus?: boolean;
};

export default function SearchInput({
  value,
  defaultValue = "",
  onChange,
  placeholder = "Search…",
  className = "",
  debounceMs = 200,
  autoFocus = false,
}: SearchInputProps) {
  const [internal, setInternal] = useState(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) setInternal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => onChange(internal.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [internal, debounceMs, onChange]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45 pointer-events-none" />
      <input
        type="search"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white/[0.06] border border-white/12 text-sm text-white placeholder:text-white/40 outline-none focus:border-purple-500/40 focus:ring-2 focus:ring-purple-500/15 transition-all"
      />
      {internal && (
        <button
          type="button"
          onClick={() => setInternal("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
