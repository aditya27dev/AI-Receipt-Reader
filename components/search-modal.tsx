"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ScanLine,
  LayoutDashboard,
  FileText,
  BarChart3,
  History,
  Banknote,
  Receipt,
  Search,
} from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

interface SearchResult {
  id: string;
  merchant: string;
  total: number;
  date: string;
  category: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "scan", label: "Scan Receipt", icon: <ScanLine className="w-4 h-4" /> },
  {
    id: "transactions",
    label: "Transactions",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  {
    id: "history",
    label: "Receipt History",
    icon: <History className="w-4 h-4" />,
  },
  { id: "budget", label: "Budgets", icon: <Banknote className="w-4 h-4" /> },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchModal({ open, onClose, onNavigate }: SearchModalProps) {
  const { symbol } = useCurrency();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&type=receipts&limit=8`,
      );
      if (!res.ok) throw new Error("search failed");
      const data = await res.json();
      const receipts: SearchResult[] = (data.results ?? []).map(
        (r: { id: string; metadata: Record<string, string | number> }) => ({
          id: r.id,
          merchant: String(r.metadata?.merchant_name || "Unknown"),
          total: Number(r.metadata?.total) || 0,
          date: String(r.metadata?.purchase_date || ""),
          category: String(r.metadata?.category || "other"),
        }),
      );
      setResults(receipts);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2"
          >
            <Command className="rounded-2xl glass border border-white/20 shadow-2xl overflow-hidden bg-zinc-900/90 text-zinc-100">
              <div className="flex items-center border-b border-white/10 px-4">
                <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2" />
                <CommandInput
                  placeholder="Search receipts, navigate..."
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 border-0 outline-none focus:ring-0 py-4 text-sm"
                />
                {loading && (
                  <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin shrink-0" />
                )}
              </div>
              <CommandList className="max-h-80 overflow-y-auto">
                <CommandEmpty className="py-8 text-center text-sm text-zinc-500">
                  {query.trim()
                    ? "No results found."
                    : "Type to search receipts..."}
                </CommandEmpty>

                {/* Receipt search results */}
                {results.length > 0 && (
                  <CommandGroup
                    heading="Receipts"
                    className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                  >
                    {results.map((r) => (
                      <CommandItem
                        key={r.id}
                        value={`${r.merchant} ${r.category} ${r.date}`}
                        onSelect={() => {
                          onNavigate("history");
                          onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 text-zinc-200"
                      >
                        <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                          <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {r.merchant}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {r.date} · {r.category}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-white shrink-0">
                          {symbol}
                          {r.total.toFixed(2)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.length > 0 && (
                  <CommandSeparator className="my-1 bg-white/10" />
                )}

                {/* Navigation */}
                <CommandGroup
                  heading="Navigation"
                  className="px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  {NAV_ITEMS.filter(
                    (n) =>
                      !query.trim() ||
                      n.label.toLowerCase().includes(query.toLowerCase()),
                  ).map((nav) => (
                    <CommandItem
                      key={nav.id}
                      value={nav.label}
                      onSelect={() => {
                        onNavigate(nav.id);
                        onClose();
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 aria-selected:bg-white/10 text-zinc-300"
                    >
                      <span className="text-zinc-400">{nav.icon}</span>
                      <span className="text-sm">Go to {nav.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
