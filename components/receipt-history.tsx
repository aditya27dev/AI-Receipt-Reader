'use client';

import { useEffect, useState } from 'react';
import { StoredReceipt } from '@/lib/db';
import { format } from 'date-fns';
import { Calendar, Loader2, ImageIcon, Trash2 } from 'lucide-react';

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

export function ReceiptHistory() {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<StoredReceipt | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/receipts');
      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (receiptId: string) => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }

      // Remove from local state
      setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== receiptId));
      
      // Clear selection if deleted receipt was selected
      if (selectedReceipt?.id === receiptId) {
        setSelectedReceipt(null);
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center p-12">
        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          No receipts yet
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload your first receipt to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Receipt List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          All Receipts ({receipts.length})
        </h2>
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
          {receipts.map((receipt) => {
            const currencySymbol = getCurrencySymbol(receipt.currency);
            return (
              <button
                key={receipt.id}
                onClick={() => setSelectedReceipt(receipt)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedReceipt?.id === receipt.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  {receipt.imageUrl ? (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receipt.imageUrl}
                        alt={`Receipt from ${receipt.merchantName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}
                  
                  {/* Receipt Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {receipt.merchantName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(receipt.date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {currencySymbol}{receipt.total.toFixed(2)}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Receipt Detail */}
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-120px)] overflow-y-auto">
        {selectedReceipt ? (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Receipt Image */}
            {selectedReceipt.imageUrl && (
              <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedReceipt.imageUrl}
                  alt={`Receipt from ${selectedReceipt.merchantName}`}
                  className="w-full max-h-64 object-contain rounded-lg"
                />
              </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{selectedReceipt.merchantName}</h2>
                  {selectedReceipt.merchantAddress && (
                    <p className="text-blue-100 text-sm">{selectedReceipt.merchantAddress}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(selectedReceipt.id)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete receipt"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Metadata */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Date:</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {format(new Date(selectedReceipt.date), 'MMM dd, yyyy')}
                    {selectedReceipt.time && ` at ${selectedReceipt.time}`}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-600 dark:text-zinc-400">Payment:</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                    {selectedReceipt.paymentMethod}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
                Items ({selectedReceipt.items.length})
              </h3>
              <div className="space-y-3">
                {selectedReceipt.items.map((item, index) => {
                  const currencySymbol = getCurrencySymbol(selectedReceipt.currency);
                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
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
                  );
                })}
              </div>
            </div>

            {/* Totals */}
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
              <div className="space-y-2">
                {selectedReceipt.subtotal > 0 && (
                  <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                    <span>Subtotal</span>
                    <span>
                      {getCurrencySymbol(selectedReceipt.currency)}{selectedReceipt.subtotal.toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedReceipt.tax > 0 && (
                  <div className="flex justify-between text-sm text-zinc-700 dark:text-zinc-300">
                    <span>Tax</span>
                    <span>
                      {getCurrencySymbol(selectedReceipt.currency)}{selectedReceipt.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-100 pt-2 border-t border-zinc-300 dark:border-zinc-700">
                  <span>Total</span>
                  <span>
                    {getCurrencySymbol(selectedReceipt.currency)}{selectedReceipt.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
            <p className="text-zinc-600 dark:text-zinc-400">
              Select a receipt to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
