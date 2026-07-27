"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSearch } from "@/hooks/use-search";
import { useDebounce } from "@/hooks/use-debounce";
import { EmailList } from "@/components/email/email-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useSearch({
    q: debouncedQuery,
    ...filters,
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search emails by subject, sender, or content..."
              className="w-full rounded-xl border bg-background pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                Filters
              </Button>
            </div>
            {data && (
              <span className="text-xs text-muted-foreground">
                {data.total} results
              </span>
            )}
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 border-t pt-3"
            >
              <FilterInput label="From" value={filters.from || ""} onChange={(v) => setFilters((f) => ({ ...f, from: v }))} />
              <FilterInput label="To" value={filters.to || ""} onChange={(v) => setFilters((f) => ({ ...f, to: v }))} />
              <FilterInput label="Subject" value={filters.subject || ""} onChange={(v) => setFilters((f) => ({ ...f, subject: v }))} />
              <FilterInput label="Category" value={filters.category || ""} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} />
              <FilterInput label="After (YYYY-MM-DD)" value={filters.after || ""} onChange={(v) => setFilters((f) => ({ ...f, after: v }))} />
              <FilterInput label="Before (YYYY-MM-DD)" value={filters.before || ""} onChange={(v) => setFilters((f) => ({ ...f, before: v }))} />
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Has Attachments</label>
                <input
                  type="checkbox"
                  checked={filters.hasAttachment === "true"}
                  onChange={(e) => setFilters((f) => ({ ...f, hasAttachment: e.target.checked ? "true" : "" }))}
                  className="rounded"
                />
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>

      <div>
        {debouncedQuery ? (
          <EmailList
            emails={data?.messages || []}
            isLoading={isLoading}
            hasMore={data?.hasMore}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="h-16 w-16 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <h3 className="text-lg font-semibold text-muted-foreground">Search your emails</h3>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Type a query to search across all your connected accounts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/20"
        placeholder={label}
      />
    </div>
  );
}
