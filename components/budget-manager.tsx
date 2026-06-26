"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Lock, PlusCircle, Trash2 } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  period: "monthly";
  createdAt: string;
}

interface SpendingEntry {
  category: string;
  totalSpent: number;
  count: number;
}

const SPENDING_CATEGORIES = [
  "groceries",
  "dining",
  "transportation",
  "entertainment",
  "utilities",
  "healthcare",
  "shopping",
  "income",
  "transfer",
  "other",
];

const categoryColors: Record<string, string> = {
  groceries: "bg-green-500",
  dining: "bg-orange-500",
  transportation: "bg-blue-500",
  entertainment: "bg-purple-500",
  utilities: "bg-yellow-500",
  healthcare: "bg-red-500",
  shopping: "bg-pink-500",
  other: "bg-zinc-500",
};

export function BudgetManager({ isDemo = false }: { isDemo?: boolean }) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<SpendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState("groceries");
  const [limitAmount, setLimitAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budgetsRes, txnRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/transactions"),
      ]);
      const { budgets: fetchedBudgets } = await budgetsRes.json();
      const { summary } = await txnRes.json();
      setBudgets(fetchedBudgets ?? []);
      setSpending(summary ?? []);
    } catch {
      setError("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(limitAmount);
    if (!category || isNaN(amount) || amount <= 0) {
      setError("Enter a valid category and positive amount.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, limitAmount: amount }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      const { budget } = await res.json();
      setBudgets((prev) => {
        const filtered = prev.filter((b) => b.category !== category);
        return [...filtered, budget];
      });
      setLimitAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("Failed to delete budget");
    }
  };

  const { symbol } = useCurrency();

  const getSpent = (cat: string) =>
    spending.find((s) => s.category === cat)?.totalSpent ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-4">
          Set Monthly Budget
        </h3>
        {isDemo ? (
          <div className="flex items-center gap-3 py-3 text-zinc-500">
            <Lock className="w-4 h-4 shrink-0" />
            <p className="text-sm">
              Budget editing is disabled in demo mode. Sign up to manage your
              own budgets.
            </p>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSave}
              className="flex flex-wrap gap-3 items-end"
            >
              <div className="flex-1 min-w-[160px]">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-zinc-200"
                >
                  {SPENDING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Limit (monthly)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                {saving ? "Saving…" : "Save Budget"}
              </button>
            </form>
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
          </>
        )}
      </div>

      {budgets.length === 0 ? (
        <div className="text-center glass border border-white/10 rounded-xl py-12">
          <p className="text-zinc-500">
            No budgets set yet. Add one above to track your spending limits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const spent = getSpent(budget.category);
            const pct = Math.min((spent / budget.limitAmount) * 100, 100);
            const over = spent > budget.limitAmount;
            const warning = !over && pct >= 80;
            const barColor = over
              ? "bg-red-500"
              : warning
                ? "bg-amber-500"
                : (categoryColors[budget.category] ?? "bg-blue-500");

            return (
              <div
                key={budget.id}
                className={`glass rounded-xl border p-5 ${
                  over
                    ? "border-red-500/40"
                    : warning
                      ? "border-amber-500/40"
                      : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-zinc-100 capitalize">
                    {budget.category}
                  </span>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                    title="Delete budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>
                      {symbol}
                      {spent.toFixed(2)} spent
                    </span>
                    <span>
                      {symbol}
                      {budget.limitAmount.toFixed(2)} limit
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                {over && (
                  <p className="text-xs text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Over budget by {symbol}
                    {(spent - budget.limitAmount).toFixed(2)}
                  </p>
                )}
                {warning && !over && (
                  <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {Math.round(pct)}% of budget used
                  </p>
                )}
                {!over && !warning && (
                  <p className="text-xs text-zinc-500">
                    {symbol}
                    {(budget.limitAmount - spent).toFixed(2)} remaining
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
