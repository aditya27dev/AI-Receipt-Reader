"use client";

import { useState } from "react";
import { Loader2, AlertCircle, FileText, CheckCircle } from "lucide-react";

interface BankStatementUploaderProps {
  onStatementProcessed: () => void;
}

export function BankStatementUploader({
  onStatementProcessed,
}: BankStatementUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState<"openai" | "anthropic">(
    "openai",
  );
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", selectedModel);

      const response = await fetch("/api/process-statement", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process statement");
      }

      const data = await response.json();

      setSuccess(true);
      setTransactionCount(data.count);
      onStatementProcessed();

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Upload error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      setIsDragging(true);
    }
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

    if (isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    await handleFile(file);
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Upload Bank Statement
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Upload your PDF statement to automatically track and categorize all
          transactions.
        </p>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            AI Model:
          </label>
          <select
            value={selectedModel}
            onChange={(e) =>
              setSelectedModel(e.target.value as "openai" | "anthropic")
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            disabled={isProcessing}
          >
            <option value="openai">GPT-4o (OpenAI)</option>
            <option value="anthropic">Claude 3.5 Sonnet</option>
          </select>
        </div>
      </div>

      <label
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isProcessing
            ? "border-zinc-400 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed"
            : isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-500"
              : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 mb-4 text-zinc-500 animate-spin" />
              <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Processing statement...</span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Extracting and categorizing transactions with AI
              </p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 mb-4 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Click to upload statement</span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                PDF bank statements only
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </label>

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2 dark:bg-green-900/20 dark:border-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Success!
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">
              Extracted and saved {transactionCount} transactions. Check the
              Transactions tab to view them.
            </p>
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
