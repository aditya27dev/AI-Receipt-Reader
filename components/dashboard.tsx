"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Receipt,
  TrendingUp,
  ScanLine,
  FileText,
  ArrowRight,
  DollarSign,
  ShoppingCart,
  Calendar,
  BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onScanClick: () => void;
}

interface Stats {
  totalReceipts: number;
  totalSpend: number;
  avgReceipt: number;
  topCategory: string;
  recentReceipts: RecentReceipt[];
  spendByDay: SpendPoint[];
}

interface RecentReceipt {
  id: string;
  merchant: string;
  total: number;
  date: string;
  category: string;
}

interface SpendPoint {
  date: string;
  amount: number;
}

function AnimatedNumber({
  value,
  prefix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  decimals?: number;
}) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return controls.stop;
  }, [value, mv, decimals]);

  return (
    <span>
      {prefix}
      {display}
    </span>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-500/20 text-orange-300",
  transport: "bg-blue-500/20 text-blue-300",
  entertainment: "bg-purple-500/20 text-purple-300",
  shopping: "bg-pink-500/20 text-pink-300",
  health: "bg-green-500/20 text-green-300",
  utilities: "bg-yellow-500/20 text-yellow-300",
  other: "bg-zinc-500/20 text-zinc-300",
};

export function Dashboard({ onNavigate, onScanClick }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/receipts?limit=100");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const receipts: Array<{
          id: string;
          metadata: Record<string, string | number>;
        }> = data.receipts ?? [];

        const totalSpend = receipts.reduce(
          (s, r) => s + (Number(r.metadata.total) || 0),
          0,
        );
        const avgReceipt = receipts.length ? totalSpend / receipts.length : 0;

        // top category
        const catCount: Record<string, number> = {};
        for (const r of receipts) {
          const c = String(r.metadata.category || "other").toLowerCase();
          catCount[c] = (catCount[c] || 0) + 1;
        }
        const topCategory =
          Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

        // recent 5
        const recentReceipts: RecentReceipt[] = receipts
          .slice(0, 5)
          .map((r) => ({
            id: r.id,
            merchant: String(r.metadata.merchant_name || "Unknown"),
            total: Number(r.metadata.total) || 0,
            date: String(r.metadata.purchase_date || ""),
            category: String(r.metadata.category || "other").toLowerCase(),
          }));

        // spend last 7 days grouped by date
        const byDate: Record<string, number> = {};
        const now = Date.now();
        for (const r of receipts) {
          const raw = String(r.metadata.purchase_date || "");
          const ts = Date.parse(raw);
          if (!isNaN(ts) && now - ts < 7 * 86400000) {
            const d = new Date(ts).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            byDate[d] = (byDate[d] || 0) + (Number(r.metadata.total) || 0);
          }
        }
        const spendByDay: SpendPoint[] = Object.entries(byDate)
          .sort((a, b) => Date.parse(a[0]) - Date.parse(b[0]))
          .map(([date, amount]) => ({
            date,
            amount: Math.round(amount * 100) / 100,
          }));

        setStats({
          totalReceipts: receipts.length,
          totalSpend,
          avgReceipt,
          topCategory,
          recentReceipts,
          spendByDay,
        });
      } catch {
        setStats({
          totalReceipts: 0,
          totalSpend: 0,
          avgReceipt: 0,
          topCategory: "—",
          recentReceipts: [],
          spendByDay: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const kpis = stats
    ? [
        {
          title: "Total Receipts",
          value: stats.totalReceipts,
          prefix: "",
          decimals: 0,
          icon: <Receipt className="w-5 h-5" />,
          color: "from-violet-600/30 to-indigo-600/30",
        },
        {
          title: "Total Spend",
          value: stats.totalSpend,
          prefix: "$",
          decimals: 2,
          icon: <DollarSign className="w-5 h-5" />,
          color: "from-emerald-600/30 to-teal-600/30",
        },
        {
          title: "Avg Receipt",
          value: stats.avgReceipt,
          prefix: "$",
          decimals: 2,
          icon: <ShoppingCart className="w-5 h-5" />,
          color: "from-orange-600/30 to-amber-600/30",
        },
        {
          title: "Top Category",
          value: null,
          prefix: "",
          decimals: 0,
          icon: <BarChart2 className="w-5 h-5" />,
          color: "from-pink-600/30 to-rose-600/30",
          text: stats.topCategory,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* KPI bento grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl glass border border-white/10 p-5 space-y-3"
              >
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-8 w-32 bg-white/10" />
              </div>
            ))
          : kpis.map((kpi, i) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`rounded-2xl bg-gradient-to-br ${kpi.color} glass border border-white/10 p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    {kpi.title}
                  </span>
                  <span className="text-zinc-400">{kpi.icon}</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {kpi.text ? (
                    <span className="capitalize">{kpi.text}</span>
                  ) : (
                    <AnimatedNumber
                      value={kpi.value!}
                      prefix={kpi.prefix}
                      decimals={kpi.decimals}
                    />
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {/* Spend trend + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Area chart — span 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="lg:col-span-3 rounded-2xl glass border border-white/10 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Spend Trend</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Last 7 days</p>
            </div>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          {loading ? (
            <Skeleton className="h-40 bg-white/10 rounded-xl" />
          ) : stats!.spendByDay.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-zinc-600">
              <Calendar className="w-8 h-8 mb-2" />
              <p className="text-sm">No spend data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={stats!.spendByDay}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  formatter={(v: number | undefined) =>
                    [`$${(v ?? 0).toFixed(2)}`, "Spend"] as [string, string]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#spendGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Recent activity — span 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="lg:col-span-2 rounded-2xl glass border border-white/10 p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Recent Receipts</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Latest scans</p>
            </div>
            <button
              onClick={() => onNavigate("history")}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-28 bg-white/10" />
                    <Skeleton className="h-3 w-16 bg-white/10" />
                  </div>
                  <Skeleton className="h-3 w-12 bg-white/10" />
                </div>
              ))
            ) : stats!.recentReceipts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-8">
                <Receipt className="w-8 h-8 mb-2" />
                <p className="text-sm">No receipts yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 glass border-white/20 text-zinc-300 hover:text-white"
                  onClick={onScanClick}
                >
                  Scan first receipt
                </Button>
              </div>
            ) : (
              stats!.recentReceipts.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-default"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {r.merchant}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 border-0 ${CATEGORY_COLORS[r.category] ?? CATEGORY_COLORS.other}`}
                    >
                      {r.category}
                    </Badge>
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">
                    ${r.total.toFixed(2)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          {
            label: "Scan Receipt",
            icon: <ScanLine className="w-5 h-5" />,
            action: onScanClick,
            color: "hover:from-violet-600/30 hover:to-indigo-600/30",
          },
          {
            label: "Add Transaction",
            icon: <FileText className="w-5 h-5" />,
            action: () => onNavigate("transactions"),
            color: "hover:from-blue-600/30 hover:to-cyan-600/30",
          },
          {
            label: "View Analytics",
            icon: <BarChart2 className="w-5 h-5" />,
            action: () => onNavigate("analytics"),
            color: "hover:from-emerald-600/30 hover:to-teal-600/30",
          },
          {
            label: "Manage Budgets",
            icon: <DollarSign className="w-5 h-5" />,
            action: () => onNavigate("budget"),
            color: "hover:from-orange-600/30 hover:to-amber-600/30",
          },
        ].map((q) => (
          <button
            key={q.label}
            onClick={q.action}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl glass border border-white/10 text-zinc-400 hover:text-white bg-gradient-to-br from-transparent to-transparent ${q.color} transition-all duration-300`}
          >
            {q.icon}
            <span className="text-xs font-medium">{q.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
