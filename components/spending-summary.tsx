'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

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

// Get currency symbol from currency code
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'AUD': 'A$',
    'CAD': 'C$',
  };
  return symbols[currencyCode?.toUpperCase()] || currencyCode || '$';
}

// Detect the most common currency from receipts
function detectPrimaryCurrency(receipts: Array<{ currency?: string }>): string {
  const currencyCount = new Map<string, number>();
  
  receipts.forEach(receipt => {
    const currency = receipt.currency?.toUpperCase() || 'USD';
    currencyCount.set(currency, (currencyCount.get(currency) || 0) + 1);
  });
  
  if (currencyCount.size === 0) return 'USD';
  
  // Find currency with highest count
  let maxCount = 0;
  let primaryCurrency = 'USD';
  currencyCount.forEach((count, currency) => {
    if (count > maxCount) {
      maxCount = count;
      primaryCurrency = currency;
    }
  });
  
  return primaryCurrency;
}

const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#10b981',
  dining: '#f59e0b',
  transportation: '#3b82f6',
  entertainment: '#8b5cf6',
  utilities: '#eab308',
  healthcare: '#ef4444',
  shopping: '#ec4899',
  other: '#6b7280',
};

export function SpendingSummary() {
  const [data, setData] = useState<SpendingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>(['USD']);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/receipts');
      const result = await response.json() as {
        receipts: Array<{ id: string; total: number; date: string; currency?: string }>;
        summary: Array<{ category: string; totalSpent: number; count: number }>;
        spendingOverTime: Array<{ date: string; total: number }>;
      };
      setData(result);
      
      // Detect primary currency and available currencies
      if (result.receipts && result.receipts.length > 0) {
        const primaryCurrency = detectPrimaryCurrency(result.receipts);
        setSelectedCurrency(primaryCurrency);
        
        // Get unique currencies
        const currencies = [...new Set(result.receipts.map((r) => r.currency?.toUpperCase() || 'USD'))];
        setAvailableCurrencies(currencies);
      }
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = getCurrencySymbol(selectedCurrency);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data || data.receipts.length === 0) {
    return (
      <div className="text-center p-12 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No receipts yet
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload your first receipt to see spending analytics
        </p>
      </div>
    );
  }

  const totalSpent = data.summary.reduce((sum, item) => sum + item.totalSpent, 0);
  const totalReceipts = data.receipts.length;

  // Prepare data for pie chart
  const pieData = data.summary.map(item => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.totalSpent,
    color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other,
  }));

  // Prepare data for bar chart
  const barData = data.summary.map(item => ({
    category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    amount: item.totalSpent,
    count: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Currency Selector */}
      {availableCurrencies.length > 1 && (
        <div className="flex items-center justify-end gap-3">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Currency:
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {availableCurrencies.map(currency => (
              <option key={currency} value={currency}>
                {currency} ({getCurrencySymbol(currency)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Spent</p>
              <p className="text-3xl font-bold">{currencySymbol}{totalSpent.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Receipts</p>
              <p className="text-3xl font-bold">{totalReceipts}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Avg per Receipt</p>
              <p className="text-3xl font-bold">{currencySymbol}{(totalSpent / totalReceipts).toFixed(2)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-200" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category - Bar Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
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
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#9ca3af' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution - Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                formatter={(value) => `${currencySymbol}${Number(value).toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Over Time */}
        {data.spendingOverTime.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              Spending Over Time (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.spendingOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                  formatter={(value) => `${currencySymbol}${Number(value).toFixed(2)}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                  name="Daily Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
            Detailed Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-y border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Avg per Transaction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {data.summary.map((item) => (
                <tr key={item.category} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                      />
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                        {item.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
                    {currencySymbol}{item.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    {currencySymbol}{(item.totalSpent / item.count).toFixed(2)}
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
