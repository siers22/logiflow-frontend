"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { Input } from "./input";
import { cn } from "./utils";

interface NominatimResult {
  place_id: number;
  display_name: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=ru`,
          { headers: { "User-Agent": "logiflow/1.0" } },
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setIsOpen(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (displayName: string) => {
    setQuery(displayName);
    onChange(displayName);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-1 w-[420px] max-w-[90vw] bg-white dark:bg-gray-900 border border-black/[0.08] dark:border-white/[0.1] rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              className="w-full text-left px-3 py-2.5 text-sm flex items-start gap-2 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s.display_name)}
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 line-clamp-3">
                {s.display_name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
