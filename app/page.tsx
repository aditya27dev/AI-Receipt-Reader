"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ReceiptUploader } from "@/components/receipt-uploader";
import { ReceiptDisplay } from "@/components/receipt-display";
import { Receipt } from "@/lib/schemas";
import {
  ScanLine,
  LayoutDashboard,
  FileText,
  BarChart3,
  History,
  Banknote,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencySelector } from "@/components/currency-selector";
import { ApiKeyBanner } from "@/components/api-key-banner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ErrorBoundary } from "@/components/error-boundary";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

const SpendingSummary = dynamic(
  () =>
    import("@/components/spending-summary").then((m) => ({
      default: m.SpendingSummary,
    })),
  { ssr: false },
);
const ReceiptHistory = dynamic(
  () =>
    import("@/components/receipt-history").then((m) => ({
      default: m.ReceiptHistory,
    })),
  { ssr: false },
);
const BankStatementUploader = dynamic(
  () =>
    import("@/components/bank-statement-uploader").then((m) => ({
      default: m.BankStatementUploader,
    })),
  { ssr: false },
);
const TransactionHistory = dynamic(
  () =>
    import("@/components/transaction-history").then((m) => ({
      default: m.TransactionHistory,
    })),
  { ssr: false },
);
const BudgetManager = dynamic(
  () =>
    import("@/components/budget-manager").then((m) => ({
      default: m.BudgetManager,
    })),
  { ssr: false },
);
const Dashboard = dynamic(
  () =>
    import("@/components/dashboard").then((m) => ({
      default: m.Dashboard,
    })),
  { ssr: false },
);
const SearchModal = dynamic(
  () =>
    import("@/components/search-modal").then((m) => ({
      default: m.SearchModal,
    })),
  { ssr: false },
);

type Tab =
  | "dashboard"
  | "scan"
  | "transactions"
  | "analytics"
  | "history"
  | "budget";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "scan", label: "Scan", icon: <ScanLine className="w-4 h-4" /> },
  {
    id: "transactions",
    label: "Transactions",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart3 className="w-4 h-4" />,
  },
  { id: "history", label: "History", icon: <History className="w-4 h-4" /> },
  { id: "budget", label: "Budgets", icon: <Banknote className="w-4 h-4" /> },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [latestReceipt, setLatestReceipt] = useState<Receipt | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [refreshTransactions, setRefreshTransactions] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleReceiptExtracted = (receipt: Receipt) => {
    setLatestReceipt(receipt);
    setRefreshHistory((prev) => prev + 1);
    setTimeout(() => setActiveTab("analytics"), 2000);
  };

  const handleStatementProcessed = () => {
    setRefreshTransactions((prev) => prev + 1);
  };

  return (
    <AuthGuard>
      <div className="aurora-bg min-h-screen">
        {/* Sticky glass header */}
        <header className="sticky top-0 z-40 glass border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <ScanLine className="w-4 h-4 text-white" />
              </div>
              <span className="shimmer-text text-xl font-bold tracking-tight">
                Receipt AI
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CurrencySelector />
              {session && (
                <span className="text-xs text-white/40 hidden sm:inline">
                  {session.user.email}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="glass border-white/20 text-zinc-300 hover:text-white hover:bg-white/10 gap-2 hidden sm:flex"
              >
                <Search className="w-3.5 h-3.5" />
                Search
                <kbd className="ml-1 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-zinc-400">
                  ⌘K
                </kbd>
              </Button>
              {session && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => authClient.signOut()}
                  className="text-zinc-400 hover:text-white"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        <ApiKeyBanner />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Floating pill nav */}
          <nav className="flex gap-1 p-1 rounded-2xl glass border border-white/10 w-fit mx-auto mb-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/60 to-indigo-600/60 shadow-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10 hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ErrorBoundary>
                {activeTab === "dashboard" && (
                  <Dashboard
                    onNavigate={(tab: string) => setActiveTab(tab as Tab)}
                    onScanClick={() => setActiveTab("scan")}
                  />
                )}

                {activeTab === "scan" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4">
                        Upload Receipt
                      </h2>
                      <ReceiptUploader
                        onReceiptExtracted={handleReceiptExtracted}
                      />
                    </div>
                    {latestReceipt ? (
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-4">
                          Extracted Data
                        </h2>
                        <ReceiptDisplay receipt={latestReceipt} />
                      </div>
                    ) : (
                      <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl glass border border-white/10 min-h-[320px]">
                        <ScanLine className="w-12 h-12 text-zinc-600 mb-3" />
                        <p className="text-zinc-500 text-sm">
                          Extracted receipt data will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "transactions" && (
                  <div className="space-y-8">
                    <BankStatementUploader
                      onStatementProcessed={handleStatementProcessed}
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-4">
                        All Transactions
                      </h2>
                      <TransactionHistory key={refreshTransactions} />
                    </div>
                  </div>
                )}

                {activeTab === "analytics" && <SpendingSummary />}

                {activeTab === "history" && (
                  <ReceiptHistory key={refreshHistory} />
                )}

                {activeTab === "budget" && (
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6">
                      Monthly Budgets
                    </h2>
                    <BudgetManager />
                  </div>
                )}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        {searchOpen && (
          <SearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onNavigate={(tab: string) => {
              setActiveTab(tab as Tab);
              setSearchOpen(false);
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}
