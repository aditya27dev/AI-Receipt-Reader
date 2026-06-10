"use client";

import { useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { bankStatementSchema } from "@/lib/transaction-schemas";
import { useApiKey } from "@/lib/api-key-context";

const VERCEL_MODE = process.env.NEXT_PUBLIC_VERCEL_MODE === "true";
import { Loader2, AlertCircle, FileText, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BankStatementUploaderProps {
  onStatementProcessed: () => void;
}

export function BankStatementUploader({
  onStatementProcessed,
}: BankStatementUploaderProps) {
  const { apiFetch } = useApiKey();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [finalCount, setFinalCount] = useState(0);
  const [selectedModel, setSelectedModel] = useState<"openai" | "anthropic">(
    "openai",
  );
  const [isDragging, setIsDragging] = useState(false);

  const {
    object: partialStatement,
    submit,
    isLoading,
  } = useObject({
    api: "/api/process-statement",
    schema: bankStatementSchema,
    fetch: apiFetch,
    onFinish: ({ object }) => {
      const count = object?.transactions?.length ?? 0;
      setFinalCount(count);
      setSuccess(true);
      onStatementProcessed();
    },
    onError: (err) => {
      const msg =
        err instanceof Error
          ? err.message.includes("401")
            ? "API key required or invalid. Check the banner above."
            : err.message.includes("429")
              ? "Rate limit reached. Please wait a minute and try again."
              : err.message.includes("413")
                ? "File too large. Please use a PDF under 20 MB."
                : "Failed to process statement. Please try again."
          : "Failed to process statement. Please try again.";
      setError(msg);
      toast.error(msg);
    },
  });

  const liveCount = partialStatement?.transactions?.length ?? 0;

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }
    setError(null);
    setSuccess(false);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    submit({ file: base64, model: selectedModel });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
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
    if (!file.type.includes("pdf")) {
      toast.error("Please upload a PDF file");
      setError("Please upload a PDF file");
      return;
    }
    await handleFile(file);
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">
          Upload Bank Statement
        </h3>
        <p className="text-sm text-zinc-500 mb-3">
          Upload your PDF statement to automatically track and categorize all
          transactions.
        </p>
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
      </div>

      <label
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          isLoading
            ? "border-zinc-600 bg-zinc-800/30 cursor-not-allowed"
            : isDragging
              ? "border-violet-500 bg-violet-950/20"
              : "border-white/20 bg-white/5 hover:bg-white/10"
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isLoading ? (
            <>
              <Loader2 className="w-10 h-10 mb-3 text-violet-400 animate-spin" />
              <p className="mb-1 text-sm font-semibold text-zinc-300">
                Processing statement…
              </p>
              <p className="text-xs text-zinc-500">
                {liveCount > 0
                  ? `${liveCount} transaction${liveCount !== 1 ? "s" : ""} found so far…`
                  : "Extracting and categorising transactions with AI"}
              </p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 mb-4 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-300">
                <span className="font-semibold">Click to upload statement</span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-zinc-600">PDF bank statements only</p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      {success && (
        <div className="p-3 border border-emerald-500/30 bg-emerald-950/20 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300 flex-1">
            Extracted and saved {finalCount} transaction
            {finalCount !== 1 ? "s" : ""}. Check the Transactions tab.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-emerald-600 hover:text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
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
