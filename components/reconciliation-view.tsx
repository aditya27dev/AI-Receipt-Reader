"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  GitMerge,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency-context";

interface ReconcileMatch {
  transactionId: string;
  receiptId: string | null;
  transactionDate: string;
  transactionDescription: string;
  transactionAmount: number;
  receiptMerchant?: string;
  receiptTotal?: number;
  receiptDate?: string;
  confidence: number;
  status: "matched" | "unmatched" | "partial";
}

interface ReconcileData {
  matches: ReconcileMatch[];
  summary: {
    total: number;
    matched: number;
    unmatched: number;
    partial: number;
  };
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 0.8
      ? "bg-emerald-500"
      : value >= 0.5
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 w-8 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

export function ReconciliationView() {
  const { symbol } = useCurrency();
  const [data, setData] = useState<ReconcileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "matched" | "unmatched" | "partial"
  >("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reconcile");
      const json = await res.json();
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !data) fetchData();
  }, [expanded]);

  const filtered =
    data?.matches.filter((m) => filter === "all" || m.status === filter) ?? [];

  const statusBadge = (s: ReconcileMatch["status"]) => {
    if (s === "matched")
      return (
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
          Matched
        </Badge>
      );
    if (s === "partial")
      return (
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
          Partial
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
        Unmatched
      </Badge>
    );
  };

  return (
    <div className="glass border border-white/10 rounded-xl overflow-hidden">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <GitMerge className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-zinc-100">
            Transaction Reconciliation
          </span>
          {data && (
            <span className="text-xs text-zinc-500">
              {data.summary.matched}/{data.summary.total} matched
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200 h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                fetchData();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : !data ? (
              <div className="text-center py-10 text-zinc-500 text-sm">
                Failed to load reconciliation data.
              </div>
            ) : (
              <div>
                {/* Summary row */}
                <div className="grid grid-cols-4 gap-px bg-white/5 border-t border-white/5">
                  {[
                    {
                      label: "Total",
                      value: data.summary.total,
                      color: "text-zinc-200",
                    },
                    {
                      label: "Matched",
                      value: data.summary.matched,
                      color: "text-emerald-400",
                    },
                    {
                      label: "Partial",
                      value: data.summary.partial,
                      color: "text-amber-400",
                    },
                    {
                      label: "Unmatched",
                      value: data.summary.unmatched,
                      color: "text-red-400",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center py-3 bg-white/[0.02]"
                    >
                      <span className={`text-xl font-bold ${s.color}`}>
                        {s.value}
                      </span>
                      <span className="text-xs text-zinc-600">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Filter pills */}
                <div className="flex gap-2 px-6 py-3 border-t border-white/5">
                  {(["all", "matched", "partial", "unmatched"] as const).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          filter === f
                            ? "bg-violet-600 text-white"
                            : "glass border border-white/10 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ),
                  )}
                </div>

                {/* Table */}
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No items in this category.
                  </div>
                ) : (
                  <div className="overflow-x-auto border-t border-white/5">
                    <table className="w-full text-sm">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-zinc-500 font-medium">
                            Transaction
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-zinc-500 font-medium">
                            Date
                          </th>
                          <th className="px-4 py-2 text-right text-xs text-zinc-500 font-medium">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-zinc-500 font-medium">
                            Matched Receipt
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-zinc-500 font-medium">
                            Confidence
                          </th>
                          <th className="px-4 py-2 text-left text-xs text-zinc-500 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filtered.map((m) => (
                          <tr
                            key={m.transactionId}
                            className="hover:bg-white/5"
                          >
                            <td className="px-4 py-3 text-zinc-300 max-w-[200px] truncate">
                              {m.transactionDescription}
                            </td>
                            <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">
                              {m.transactionDate}
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-200 font-mono whitespace-nowrap">
                              {m.transactionAmount < 0 ? "" : "-"}
                              {symbol}
                              {Math.abs(m.transactionAmount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-zinc-400">
                              {m.receiptMerchant ? (
                                <span>
                                  {m.receiptMerchant} · {symbol}
                                  {m.receiptTotal?.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-zinc-600 italic">
                                  None
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <ConfidenceBar value={m.confidence} />
                            </td>
                            <td className="px-4 py-3">
                              {statusBadge(m.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
