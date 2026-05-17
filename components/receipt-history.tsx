"use client";

import { useEffect, useState, useMemo } from "react";
import { StoredReceipt } from "@/lib/db";
import { format } from "date-fns";
import {
  Calendar,
  Loader2,
  ImageIcon,
  Trash2,
  Download,
  Search,
  Filter,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Get currency symbol from currency code
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
  };
  return symbols[currencyCode?.toUpperCase()] || currencyCode || "$";
}

const categoryColors: Record<string, string> = {
  groceries: "bg-green-500/20 text-green-300",
  dining: "bg-orange-500/20 text-orange-300",
  transportation: "bg-blue-500/20 text-blue-300",
  entertainment: "bg-purple-500/20 text-purple-300",
  utilities: "bg-yellow-500/20 text-yellow-300",
  healthcare: "bg-red-500/20 text-red-300",
  shopping: "bg-pink-500/20 text-pink-300",
  other: "bg-zinc-500/20 text-zinc-400",
};

export function ReceiptHistory() {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<StoredReceipt | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<StoredReceipt | null>(
    null,
  );
  const [editFields, setEditFields] = useState({
    merchant_name: "",
    total: "",
    purchase_date: "",
    category: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const PAGE_SIZE = 20;

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        r.merchantName.toLowerCase().includes(q) ||
        r.items.some((i) => i.name.toLowerCase().includes(q));
      const matchesFrom = !dateFrom || new Date(r.date) >= new Date(dateFrom);
      const matchesTo = !dateTo || new Date(r.date) <= new Date(dateTo);
      return matchesQuery && matchesFrom && matchesTo;
    });
  }, [receipts, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchReceipts(1, true);
  }, []);

  const fetchReceipts = async (pageNum: number, replace = false) => {
    replace ? setLoading(true) : setLoadingMore(true);
    try {
      const response = await fetch(
        `/api/receipts?page=${pageNum}&limit=${PAGE_SIZE}`,
      );
      const data = await response.json();
      const fetched: StoredReceipt[] = data.receipts || [];
      setReceipts((prev) => (replace ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = async (receiptId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this receipt? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/receipts/${receiptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete receipt");
      }

      setReceipts((prevReceipts) =>
        prevReceipts.filter((r) => r.id !== receiptId),
      );

      if (selectedReceipt?.id === receiptId) {
        setSelectedReceipt(null);
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      toast.error("Failed to delete receipt. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (r: StoredReceipt) => {
    setEditingReceipt(r);
    setEditFields({
      merchant_name: r.merchantName,
      total: String(r.total),
      purchase_date: r.date,
      category: (r as unknown as Record<string, string>).category ?? "",
      notes: "",
    });
  };

  const saveEdit = async () => {
    if (!editingReceipt) return;
    setSaving(true);
    try {
      const body: Record<string, string | number> = {};
      if (editFields.merchant_name)
        body.merchant_name = editFields.merchant_name;
      if (editFields.total) body.total = parseFloat(editFields.total);
      if (editFields.purchase_date)
        body.purchase_date = editFields.purchase_date;
      if (editFields.category) body.category = editFields.category;
      if (editFields.notes) body.notes = editFields.notes;

      const res = await fetch(`/api/receipts/${editingReceipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === editingReceipt.id
            ? {
                ...r,
                merchantName: editFields.merchant_name || r.merchantName,
                total: editFields.total
                  ? parseFloat(editFields.total)
                  : r.total,
                date: editFields.purchase_date || r.date,
                category:
                  editFields.category ||
                  (editingReceipt as unknown as Record<string, string>)
                    .category,
              }
            : r,
        ),
      );
      toast.success("Receipt updated");
      setEditingReceipt(null);
    } catch {
      toast.error("Failed to update receipt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center p-12 rounded-2xl glass border border-white/10">
        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
        <h3 className="text-lg font-semibold text-zinc-300 mb-2">
          No receipts yet
        </h3>
        <p className="text-zinc-500">
          Upload your first receipt to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt List */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                All Receipts ({filteredReceipts.length}
                {hasMore && receipts.length === filteredReceipts.length
                  ? "+"
                  : ""}
                )
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md glass border border-white/20 text-zinc-300 hover:text-white transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-900 border-white/20 text-zinc-200">
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-white/10"
                    onClick={() => {
                      window.location.href =
                        "/api/export?format=csv&type=receipts";
                    }}
                  >
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-white/10"
                    onClick={() => {
                      window.location.href =
                        "/api/export?format=json&type=receipts";
                    }}
                  >
                    Export JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <Input
                  placeholder="Search merchant or items…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 glass border-white/20 bg-transparent text-zinc-200 placeholder:text-zinc-600 text-sm"
                />
              </div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 glass border-white/20 bg-transparent text-zinc-300 text-xs"
                title="From date"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 glass border-white/20 bg-transparent text-zinc-300 text-xs"
                title="To date"
              />
            </div>
            {(searchQuery || dateFrom || dateTo) && (
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-zinc-500" />
                <span className="text-xs text-zinc-500">Filters active</span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-2">
            {filteredReceipts.length === 0 && !loading ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No receipts match your filters.
              </div>
            ) : (
              filteredReceipts.map((receipt) => {
                const currencySymbol = getCurrencySymbol(receipt.currency);
                return (
                  <button
                    key={receipt.id}
                    onClick={() => setSelectedReceipt(receipt)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedReceipt?.id === receipt.id
                        ? "border-violet-500/60 bg-violet-950/20"
                        : "glass border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex gap-4">
                      {receipt.imageUrl ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={receipt.imageUrl}
                            alt={`Receipt from ${receipt.merchantName}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <ImageIcon className="w-7 h-7 text-zinc-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-200 truncate">
                          {receipt.merchantName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {format(new Date(receipt.date), "MMM dd, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-base font-bold text-white">
                            {currencySymbol}
                            {receipt.total.toFixed(2)}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {receipt.items.length} item
                            {receipt.items.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
            {hasMore && (
              <button
                onClick={() => fetchReceipts(page + 1)}
                disabled={loadingMore}
                className="w-full py-3 text-sm font-medium text-violet-400 hover:text-violet-300 border border-dashed border-violet-500/30 rounded-xl transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </span>
                ) : (
                  "Load More"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Receipt Detail */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-120px)] overflow-y-auto">
          {selectedReceipt ? (
            <div className="rounded-2xl glass border border-white/10 overflow-hidden">
              {/* Receipt Image */}
              {selectedReceipt.imageUrl && (
                <div className="border-b border-white/10 bg-zinc-800/50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedReceipt.imageUrl}
                    alt={`Receipt from ${selectedReceipt.merchantName}`}
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}

              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600/50 to-indigo-600/50 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">
                      {selectedReceipt.merchantName}
                    </h2>
                    {selectedReceipt.merchantAddress && (
                      <p className="text-zinc-300 text-sm">
                        {selectedReceipt.merchantAddress}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openEdit(selectedReceipt)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-violet-500/20 text-white rounded-lg transition-colors text-sm mr-2"
                    title="Edit receipt"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedReceipt.id)}
                    disabled={deleting}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-red-500/20 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                    title="Delete receipt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="p-5 border-b border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Date:</span>
                    <p className="font-medium text-zinc-200">
                      {format(new Date(selectedReceipt.date), "MMM dd, yyyy")}
                      {selectedReceipt.time && ` at ${selectedReceipt.time}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Payment:</span>
                    <p className="font-medium text-zinc-200 capitalize">
                      {selectedReceipt.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="p-5">
                <h3 className="text-base font-semibold mb-3 text-zinc-200">
                  Items ({selectedReceipt.items.length})
                </h3>
                <div className="space-y-2">
                  {selectedReceipt.items.map((item, index) => {
                    const currencySymbol = getCurrencySymbol(
                      selectedReceipt.currency,
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 rounded-xl bg-white/5"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-zinc-200 text-sm">
                              {item.name}
                            </p>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${categoryColors[item.category] ?? categoryColors.other}`}
                            >
                              {item.category}
                            </span>
                          </div>
                          {item.quantity && item.unitPrice && (
                            <p className="text-xs text-zinc-500">
                              {item.quantity} × {currencySymbol}
                              {item.unitPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold text-zinc-200 text-sm">
                          {currencySymbol}
                          {item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              <div className="p-5 bg-white/5 border-t border-white/10">
                <div className="space-y-2">
                  {selectedReceipt.subtotal > 0 && (
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Subtotal</span>
                      <span>
                        {getCurrencySymbol(selectedReceipt.currency)}
                        {selectedReceipt.subtotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedReceipt.tax > 0 && (
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Tax</span>
                      <span>
                        {getCurrencySymbol(selectedReceipt.currency)}
                        {selectedReceipt.tax.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                    <span>Total</span>
                    <span>
                      {getCurrencySymbol(selectedReceipt.currency)}
                      {selectedReceipt.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl glass border border-white/10 p-12 text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-500">Select a receipt to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet
        open={!!editingReceipt}
        onOpenChange={(open) => !open && setEditingReceipt(null)}
      >
        <SheetContent className="bg-zinc-950 border-white/10 text-zinc-100 w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-zinc-100">Edit Receipt</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Merchant Name
              </label>
              <Input
                value={editFields.merchant_name}
                onChange={(e) =>
                  setEditFields((f) => ({
                    ...f,
                    merchant_name: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/20 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Total Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={editFields.total}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, total: e.target.value }))
                }
                className="bg-white/5 border-white/20 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Date</label>
              <Input
                type="date"
                value={editFields.purchase_date}
                onChange={(e) =>
                  setEditFields((f) => ({
                    ...f,
                    purchase_date: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/20 text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">
                Category
              </label>
              <Input
                value={editFields.category}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="e.g. groceries"
                className="bg-white/5 border-white/20 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Notes</label>
              <Input
                value={editFields.notes}
                onChange={(e) =>
                  setEditFields((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-white/5 border-white/20 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEditingReceipt(null)}
                className="flex-1 text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
