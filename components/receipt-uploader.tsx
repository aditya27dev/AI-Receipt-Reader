"use client";

import { useState, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Receipt } from "@/lib/schemas";
import { receiptSchema } from "@/lib/schemas";
import { useApiKey } from "@/lib/api-key-context";

const VERCEL_MODE = process.env.NEXT_PUBLIC_VERCEL_MODE === "true";
import { Upload, Loader2, AlertCircle, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReceiptUploaderProps {
  onReceiptExtracted: (receipt: Receipt) => void;
  isDemo?: boolean;
}

interface QueueItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "done" | "error";
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ReceiptUploader({
  onReceiptExtracted,
  isDemo = false,
}: ReceiptUploaderProps) {
  const { apiFetch } = useApiKey();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<"openai" | "anthropic">(
    "openai",
  );
  const [duplicateReceipt, setDuplicateReceipt] = useState<Receipt | null>(
    null,
  );
  const [pendingPayload, setPendingPayload] = useState<{
    image: string;
    mimeType: string;
    imageDataUrl: string;
    imageHash: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const processingRef = useRef(false);

  const {
    object: partialReceipt,
    submit,
    isLoading,
  } = useObject({
    api: "/api/extract-receipt",
    schema: receiptSchema,
    fetch: apiFetch,
    onFinish: ({ object }) => {
      if (object) onReceiptExtracted(object as Receipt);
      setPendingPayload(null);
    },
    onError: (err) => {
      const msg =
        err instanceof Error
          ? err.message.includes("401")
            ? "API key required or invalid. Check the banner above."
            : err.message.includes("429")
              ? "Rate limit reached. Please wait a minute and try again."
              : err.message.includes("413")
                ? "Image too large. Please use an image under 10 MB."
                : "Failed to extract receipt. Please try again."
          : "Failed to extract receipt. Please try again.";
      setError(msg);
      toast.error(msg);
    },
  });

  const processFile = async (file: File) => {
    setError(null);
    setDuplicateReceipt(null);

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Encode to base64 + hash
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const imageHash = await sha256Hex(arrayBuffer);
    const imageDataUrl = `data:${file.type};base64,${base64}`;

    // Duplicate check
    const checkRes = await fetch("/api/extract-receipt/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageHash }),
    });
    const { duplicate, receipt } = await checkRes.json();

    if (duplicate) {
      setDuplicateReceipt(receipt);
      setPendingPayload({
        image: base64,
        mimeType: file.type,
        imageDataUrl,
        imageHash,
      });
      return;
    }

    submit({
      image: base64,
      mimeType: file.type,
      model: selectedModel,
      imageDataUrl,
      imageHash,
    });
  };

  const addToQueue = (files: File[]) => {
    const newItems: QueueItem[] = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        preview: URL.createObjectURL(f),
        status: "pending" as const,
      }));
    setQueue((prev) => [...prev, ...newItems]);
    // process first pending
    if (!processingRef.current && newItems.length > 0) {
      processQueueItem(newItems[0].id, newItems[0].file);
    }
  };

  const processQueueItem = async (id: string, file: File) => {
    processingRef.current = true;
    setQueue((q) =>
      q.map((x) => (x.id === id ? { ...x, status: "processing" } : x)),
    );
    try {
      await processFile(file);
      setQueue((q) =>
        q.map((x) => (x.id === id ? { ...x, status: "done" } : x)),
      );
    } catch {
      setQueue((q) =>
        q.map((x) => (x.id === id ? { ...x, status: "error" } : x)),
      );
    } finally {
      processingRef.current = false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (files.length === 1) {
      await processFile(files[0]);
    } else {
      addToQueue(files);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) setIsDragging(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading) return;
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) {
      toast.error("Please upload an image file");
      return;
    }
    if (files.length === 1) {
      await processFile(files[0]);
    } else {
      addToQueue(files);
    }
  };

  const handleUseExisting = () => {
    if (duplicateReceipt) {
      onReceiptExtracted(duplicateReceipt);
      setDuplicateReceipt(null);
      setPendingPayload(null);
    }
  };

  const handleReprocess = () => {
    if (pendingPayload) {
      setDuplicateReceipt(null);
      submit({ ...pendingPayload, model: selectedModel });
    }
  };

  if (isDemo) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/10 rounded-xl bg-white/5 gap-3">
        <Lock className="w-10 h-10 text-zinc-600" />
        <p className="text-sm font-semibold text-zinc-300">
          Uploads disabled in demo mode
        </p>
        <p className="text-xs text-zinc-500 text-center px-6">
          Sign up for a free account to extract receipts with AI
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Model selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-zinc-300">AI Model:</span>
        <Select
          value={selectedModel}
          onValueChange={(v) => setSelectedModel(v as "openai" | "anthropic")}
          disabled={isLoading}
        >
          <SelectTrigger className="w-52 glass border-white/20 text-zinc-200 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/20 text-zinc-200">
            <SelectItem value="openai">OpenAI</SelectItem>
            {!VERCEL_MODE && (
              <SelectItem value="anthropic">Anthropic</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Batch queue */}
      {queue.length > 0 && (
        <div className="rounded-xl glass border border-white/10 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">
              Batch queue ({queue.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-zinc-500 hover:text-zinc-300"
              onClick={() => setQueue([])}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
          {queue.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt=""
                className="w-8 h-8 rounded object-cover"
              />
              <span className="text-xs text-zinc-300 flex-1 truncate">
                {item.file.name}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] border-0 ${
                  item.status === "done"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : item.status === "error"
                      ? "bg-red-500/20 text-red-300"
                      : item.status === "processing"
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-zinc-500/20 text-zinc-400"
                }`}
              >
                {item.status === "processing" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  item.status
                )}
              </Badge>
              {item.status !== "processing" && (
                <button
                  onClick={() =>
                    setQueue((q) => q.filter((x) => x.id !== item.id))
                  }
                  className="text-zinc-600 hover:text-zinc-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <label
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isLoading
            ? "border-zinc-600 bg-zinc-800/30 cursor-not-allowed"
            : isDragging
              ? "border-violet-500 bg-violet-950/20"
              : "border-white/20 bg-white/5 hover:bg-white/10"
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full px-4">
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 mb-3 text-violet-400 animate-spin" />
              <p className="mb-1 text-sm font-semibold text-zinc-300">
                Extracting receipt data…
              </p>
              {partialReceipt?.merchantName && (
                <p className="text-xs text-zinc-500">
                  {partialReceipt.merchantName}
                  {partialReceipt.total
                    ? ` · ${partialReceipt.currency ?? ""} ${partialReceipt.total}`
                    : ""}
                </p>
              )}
              {partialReceipt?.items && partialReceipt.items.length > 0 && (
                <p className="text-xs text-zinc-600 mt-1">
                  {partialReceipt.items.length} item
                  {partialReceipt.items.length !== 1 ? "s" : ""} found so far…
                </p>
              )}
            </>
          ) : preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URLs aren't optimisable by next/image
            <img
              src={preview}
              alt="Receipt preview"
              className="max-h-52 mx-auto object-contain rounded-lg"
            />
          ) : (
            <>
              <Upload className="w-12 h-12 mb-4 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-300">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-zinc-500">
                PNG, JPG, HEIC up to 10 MB · drop multiple for batch
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      {/* Duplicate Receipt Dialog */}
      {duplicateReceipt && (
        <div className="p-4 border border-amber-500/30 bg-amber-950/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-200 mb-1">
                Duplicate Receipt Detected
              </h3>
              <p className="text-sm text-amber-300/80 mb-3">
                This receipt was already uploaded. Use existing data or
                reprocess with AI.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleUseExisting}
                  disabled={isLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Use Existing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReprocess}
                  disabled={isLoading}
                  className="border-white/20 text-zinc-300 hover:text-white glass"
                >
                  {isLoading ? "Processing…" : "Reprocess with AI"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 border border-red-500/30 bg-red-950/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
