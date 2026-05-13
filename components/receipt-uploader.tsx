"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { Receipt } from "@/lib/schemas";
import { receiptSchema } from "@/lib/schemas";
import { Upload, Loader2, AlertCircle } from "lucide-react";

interface ReceiptUploaderProps {
  onReceiptExtracted: (receipt: Receipt) => void;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function ReceiptUploader({ onReceiptExtracted }: ReceiptUploaderProps) {
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

  const {
    object: partialReceipt,
    submit,
    isLoading,
  } = useObject({
    api: "/api/extract-receipt",
    schema: receiptSchema,
    onFinish: ({ object }) => {
      if (object) onReceiptExtracted(object as Receipt);
      setPendingPayload(null);
    },
    onError: () => setError("Failed to extract receipt. Please try again."),
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }
    await processFile(file);
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

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          AI Model:
        </label>
        <select
          value={selectedModel}
          onChange={(e) =>
            setSelectedModel(e.target.value as "openai" | "anthropic")
          }
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          disabled={isLoading}
        >
          <option value="openai">GPT-4o (OpenAI)</option>
          <option value="anthropic">Claude 3.5 Sonnet</option>
        </select>
      </div>

      <label
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isLoading
            ? "border-zinc-400 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed"
            : isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-500"
              : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full px-4">
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 mb-3 text-blue-500 animate-spin" />
              <p className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Extracting receipt data…
              </p>
              {partialReceipt?.merchantName && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {partialReceipt.merchantName}
                  {partialReceipt.total
                    ? ` · ${partialReceipt.currency ?? ""} ${partialReceipt.total}`
                    : ""}
                </p>
              )}
              {partialReceipt?.items && partialReceipt.items.length > 0 && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
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
              className="max-h-52 mx-auto object-contain"
            />
          ) : (
            <>
              <Upload className="w-12 h-12 mb-4 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Click to upload receipt</span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                PNG, JPG, HEIC up to 10 MB
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      {/* Duplicate Receipt Dialog */}
      {duplicateReceipt && (
        <div className="mt-4 p-4 border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">
                Duplicate Receipt Detected
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                This receipt was already uploaded. Use existing data or
                reprocess with AI.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUseExisting}
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Use Existing
                </button>
                <button
                  onClick={handleReprocess}
                  disabled={isLoading}
                  className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isLoading ? "Processing…" : "Reprocess with AI"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Error
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
