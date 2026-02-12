'use client';

import { useEffect, useState } from 'react';
import { StoredTransaction } from '@/lib/db';
import { format } from 'date-fns';
import { Loader2, FileText, TrendingUp, DollarSign } from 'lucide-react';

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
  return symbols[currencyCode?.toUpperCase()] || currencyCode || '£';
}

const categoryColors: Record<string, string> = {
  groceries: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  dining: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  transportation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  healthcare: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  travel: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  bills: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  transfer: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300',
  income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  other: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300',
};

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<StoredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-12">
        <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No transactions yet
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload your bank statement to see your transactions
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalSpending = transactions
    .filter(t => t.amount > 0 && t.category !== 'income' && t.category !== 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals = transactions
    .filter(t => t.amount > 0 && t.category !== 'income' && t.category !== 'transfer')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  const categories = ['all', ...Object.keys(categoryTotals).sort()];
  
  const filteredTransactions = selectedCategory === 'all' 
    ? transactions 
    : transactions.filter(t => t.category === selectedCategory);

  const currencySymbol = getCurrencySymbol(transactions[0]?.currency || 'GBP');

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-3xl font-bold">{transactions.length}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Spending</p>
              <p className="text-3xl font-bold">{currencySymbol}{totalSpending.toFixed(2)}</p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Top Category</p>
              <p className="text-xl font-bold capitalize">{topCategory?.[0] || 'N/A'}</p>
              {topCategory && (
                <p className="text-green-100 text-sm">{currencySymbol}{topCategory[1].toFixed(2)}</p>
              )}
            </div>
            <TrendingUp className="w-10 h-10 text-green-200" />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filter:</span>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            {category} {category !== 'all' && `(${transactions.filter(t => t.category === category).length})`}
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${categoryColors[transaction.category]}`}>
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                    transaction.amount < 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`}>
                    {transaction.amount < 0 ? '-' : ''}{currencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Summary */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
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
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                      {category}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {currencySymbol}{total.toFixed(2)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
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
