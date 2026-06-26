"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";

interface SpendingSummaryData {
  summary: Array<{
    category: string;
    totalSpent: number;
    count: number;
  }>;
  spendingOverTime: Array<{
    date: string;
    total: number;
  }>;
  receipts: Array<{
    id: string;
    total: number;
    date: string;
    currency?: string;
  }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  groceries: "#10b981",
  dining: "#f59e0b",
  transportation: "#3b82f6",
  entertainment: "#8b5cf6",
  utilities: "#eab308",
  healthcare: "#ef4444",
  shopping: "#ec4899",
  other: "#6b7280",
};

export function SpendingSummary() {
  const { symbol: currencySymbol } = useCurrency();
  const [data, setData] = useState<SpendingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/receipts");
      const result = (await response.json()) as {
        receipts: Array<{
          id: string;
          total: number;
          date: string;
          currency?: string;
        }>;
        summary: Array<{ category: string; totalSpent: number; count: number }>;
        spendingOverTime: Array<{ date: string; total: number }>;
      };
      setData(result);
    } catch (error) {
      console.error("Error fetching spending data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!data || !data.receipts || data.receipts.length === 0) {
    return (
      <div className="text-center p-12 glass border border-white/10 rounded-xl">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">
          No receipts yet
        </h3>
        <p className="text-zinc-500">
          Upload your first receipt to see spending analytics
        </p>
      </div>
    );
  }

  const totalSpent = data.summary.reduce(
    (sum, item) => sum + item.totalSpent,
    0,
  );
  const totalReceipts = data.receipts.length;

  // Prepare data for pie chart
  const pieData = data.summary.map((item) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.totalSpent,
    color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other,
  }));

  // Prepare data for bar chart
  const barData = data.summary.map((item) => ({
    category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    amount: item.totalSpent,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass border border-white/10 p-6 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-800/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium mb-1">
                Total Spent
              </p>
              <p className="text-3xl font-bold text-white">
                {currencySymbol}
                {totalSpent.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-500/60" />
          </div>
        </div>
        <div className="glass border border-white/10 p-6 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium mb-1">
                Total Receipts
              </p>
              <p className="text-3xl font-bold text-white">{totalReceipts}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-purple-500/60" />
          </div>
        </div>
        <div className="glass border border-white/10 p-6 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-medium mb-1">
                Avg per Receipt
              </p>
              <p className="text-3xl font-bold text-white">
                {currencySymbol}
                {(totalSpent / totalReceipts).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-500/60" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass border border-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-zinc-100">
            Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="category"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass border border-white/10 p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-4 text-zinc-100">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                }
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#f9fafb",
                }}
                formatter={(value) =>
                  `${currencySymbol}${Number(value).toFixed(2)}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Over Time */}
        {data.spendingOverTime.length > 0 && (
          <div className="glass border border-white/10 p-6 rounded-xl lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">
              Spending Over Time (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.spendingOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#f9fafb",
                  }}
                  formatter={(value) =>
                    `${currencySymbol}${Number(value).toFixed(2)}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6" }}
                  name="Daily Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="glass border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-zinc-100">
            Detailed Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-y border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Avg per Transaction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.summary.map((item) => (
                <tr key={item.category} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: CATEGORY_COLORS[item.category],
                        }}
                      />
                      <span className="text-sm font-medium text-zinc-200 capitalize">
                        {item.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200 font-semibold">
                    {currencySymbol}
                    {item.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {currencySymbol}
                    {(item.totalSpent / item.count).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
