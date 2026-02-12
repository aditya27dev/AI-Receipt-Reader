'use client';

import { useState } from 'react';
import { ReceiptUploader } from '@/components/receipt-uploader';
import { ReceiptDisplay } from '@/components/receipt-display';
import { SpendingSummary } from '@/components/spending-summary';
import { ReceiptHistory } from '@/components/receipt-history';
import { Receipt } from '@/lib/schemas';
import { Receipt as ReceiptIcon, BarChart3, History } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scan' | 'analytics' | 'history'>('scan');
  const [latestReceipt, setLatestReceipt] = useState<Receipt | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleReceiptExtracted = (receipt: Receipt) => {
    setLatestReceipt(receipt);
    setRefreshHistory(prev => prev + 1); // Trigger history refresh
    // Auto-switch to analytics tab after a delay
    setTimeout(() => {
      setActiveTab('analytics');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50 to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            AI Receipt Scanner
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Scan receipts with GPT-4o or Claude 3.5 Sonnet • Extract structured data • Track spending
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'scan'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <ReceiptIcon className="w-5 h-5" />
            Scan Receipt
            {activeTab === 'scan' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'analytics'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analytics
            {activeTab === 'analytics' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
              activeTab === 'history'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <History className="w-5 h-5" />
            History
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'scan' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  Upload Receipt
                </h2>
                <ReceiptUploader onReceiptExtracted={handleReceiptExtracted} />
              </div>
              {latestReceipt && (
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                    Extracted Data
                  </h2>
                  <ReceiptDisplay receipt={latestReceipt} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <SpendingSummary />
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <ReceiptHistory key={refreshHistory} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
