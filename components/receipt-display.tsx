'use client';

import { Receipt } from '@/lib/schemas';
import { format } from 'date-fns';
import { Calendar, MapPin, CreditCard } from 'lucide-react';

interface ReceiptDisplayProps {
  receipt: Receipt;
}

const categoryColors: Record<string, string> = {
  groceries: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  dining: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  transportation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  entertainment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  utilities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  healthcare: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  other: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300',
};

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
  return symbols[currencyCode.toUpperCase()] || currencyCode;
}

export function ReceiptDisplay({ receipt }: ReceiptDisplayProps) {
  const currencySymbol = getCurrencySymbol(receipt.currency || 'USD');
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <h2 className="text-2xl font-bold mb-1">{receipt.merchantName}</h2>
        {receipt.merchantAddress && (
          <div className="flex items-center gap-2 text-blue-100 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{receipt.merchantAddress}</span>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-700 dark:text-zinc-300">
              {format(new Date(receipt.date), 'MMM dd, yyyy')}
              {receipt.time && ` at ${receipt.time}`}
            </span>
          </div>
          {receipt.paymentMethod && (
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4 text-zinc-500" />
              <span className="text-zinc-700 dark:text-zinc-300 capitalize">
                {receipt.paymentMethod}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Items</h3>
        <div className="space-y-3">
          {receipt.items.map((item, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                    {item.category}
                  </span>
                </div>
                {item.quantity && item.unitPrice && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {item.quantity} × {currencySymbol}{item.unitPrice.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {currencySymbol}{item.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="space-y-2">
          {receipt.subtotal && (
            <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>Subtotal</span>
              <span>{currencySymbol}{receipt.subtotal.toFixed(2)}</span>
            </div>
          )}
          {receipt.tax && (
            <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
              <span>Tax</span>
              <span>{currencySymbol}{receipt.tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-300 dark:border-zinc-700">
            <span>Total</span>
            <span>{currencySymbol}{receipt.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
