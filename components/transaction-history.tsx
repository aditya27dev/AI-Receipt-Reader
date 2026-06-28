"use client";

import { useEffect, useState } from "react";
import { StoredTransaction } from "@/lib/db";
import { format } from "date-fns";
import {
  Loader2,
  FileText,
  TrendingUp,
  DollarSign,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/lib/currency-context";

type SortField = "date" | "description" | "category" | "amount";
type SortDir = "asc" | "desc";

const categoryColors: Record<string, string> = {
  groceries: "bg-green-500/20 text-green-300",
  dining: "bg-orange-500/20 text-orange-300",
  transportation: "bg-blue-500/20 text-blue-300",
  entertainment: "bg-purple-500/20 text-purple-300",
  utilities: "bg-yellow-500/20 text-yellow-300",
  healthcare: "bg-red-500/20 text-red-300",
  shopping: "bg-pink-500/20 text-pink-300",
  travel: "bg-indigo-500/20 text-indigo-300",
  bills: "bg-amber-500/20 text-amber-300",
  transfer: "bg-zinc-500/20 text-zinc-400",
  income: "bg-emerald-500/20 text-emerald-300",
  other: "bg-zinc-500/20 text-zinc-400",
};

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setTransactions(data.transactions ?? []);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, []);

  const { symbol: currencySymbol } = useCurrency();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-12 rounded-2xl glass border border-white/10">
        <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">
          No transactions yet
        </h3>
        <p className="text-zinc-500">
          Upload your bank statement to see your transactions
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalSpending = transactions
    .filter(
      (t) =>
        t.amount > 0 && t.category !== "income" && t.category !== "transfer",
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = transactions
    .filter(
      (t) =>
        t.amount > 0 && t.category !== "income" && t.category !== "transfer",
    )
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const topCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const categories = ["all", ...Object.keys(categoryTotals).sort()];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "date" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1" />
    );
  };

  const filteredTransactions = (
    selectedCategory === "all"
      ? transactions
      : transactions.filter((t) => t.category === selectedCategory)
  )
    .slice()
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortField) {
        case "date":
          return dir * a.date.localeCompare(b.date);
        case "description":
          return dir * a.description.localeCompare(b.description);
        case "category":
          return dir * a.category.localeCompare(b.category);
        case "amount":
          return dir * (a.amount - b.amount);
      }
    });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/30 to-blue-700/30 glass border border-white/10 p-5 rounded-2xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">
                Total Transactions
              </p>
              <p className="text-3xl font-bold">{transactions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600/30 to-purple-700/30 glass border border-white/10 p-5 rounded-2xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">
                Total Spending
              </p>
              <p className="text-3xl font-bold">
                {currencySymbol}
                {totalSpending.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/30 to-emerald-700/30 glass border border-white/10 p-5 rounded-2xl text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium mb-1">
                Top Category
              </p>
              <p className="text-xl font-bold capitalize">
                {topCategory?.[0] || "N/A"}
              </p>
              {topCategory && (
                <p className="text-zinc-400 text-sm">
                  {currencySymbol}
                  {topCategory[1].toFixed(2)}
                </p>
              )}
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Category Filter + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          <span className="text-sm font-medium text-zinc-400 shrink-0">
            Filter:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-violet-600 text-white"
                    : "glass border border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {category}{" "}
                {category !== "all" &&
                  `(${transactions.filter((t) => t.category === category).length})`}
              </button>
            ))}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md glass border border-white/20 text-zinc-300 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-900 border-white/20 text-zinc-200">
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/10"
              onClick={() => {
                window.location.href =
                  "/api/export?format=csv&type=transactions";
              }}
            >
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-white/10"
              onClick={() => {
                window.location.href =
                  "/api/export?format=json&type=transactions";
              }}
            >
              Export JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl glass border border-white/10 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                {(
                  ["date", "description", "category", "amount"] as SortField[]
                ).map((field, i) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer select-none hover:text-zinc-200 transition-colors ${i === 3 ? "text-right" : "text-left"}`}
                  >
                    <span className="inline-flex items-center">
                      {field}
                      <SortIcon field={field} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-zinc-500">
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-200">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[transaction.category] ?? categoryColors.other}`}
                    >
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm text-right font-semibold ${
                      transaction.amount < 0
                        ? "text-emerald-400"
                        : "text-zinc-200"
                    }`}
                  >
                    {transaction.amount < 0 ? "-" : ""}
                    {currencySymbol}
                    {Math.abs(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-white/5">
          {filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-500">
                      {format(new Date(transaction.date), "MMM dd, yyyy")}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${categoryColors[transaction.category] ?? categoryColors.other}`}
                    >
                      {transaction.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    transaction.amount < 0
                      ? "text-emerald-400"
                      : "text-zinc-200"
                  }`}
                >
                  {transaction.amount < 0 ? "-" : ""}
                  {currencySymbol}
                  {Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Summary */}
      <div className="rounded-2xl glass border border-white/10 p-5">
        <h3 className="text-base font-semibold mb-4 text-zinc-200">
          Spending by Category
        </h3>
        <div className="space-y-3">
          {Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([category, total]) => {
              const percentage = (total / totalSpending) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-300 capitalize">
                      {category}
                    </span>
                    <span className="text-sm font-semibold text-zinc-300">
                      {currencySymbol}
                      {total.toFixed(2)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
