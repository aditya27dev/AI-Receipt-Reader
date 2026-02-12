'use client';

import { useState } from 'react';
import { Receipt } from '@/lib/schemas';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

interface ReceiptUploaderProps {
  onReceiptExtracted: (receipt: Receipt) => void;
}

export function ReceiptUploader({ onReceiptExtracted }: ReceiptUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'anthropic'>('openai');
  const [duplicateReceipt, setDuplicateReceipt] = useState<Receipt | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Store file for potential reprocessing
    setPendingFile(file);
    
    // Process the receipt
    await processReceipt(file, false);
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

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    await handleFile(file);
  };

  const processReceipt = async (file: File, forceReprocess: boolean) => {
    setIsProcessing(true);
    setError(null);
    setDuplicateReceipt(null);

    try {
      // Convert image to data URL for storage
      const imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      const formData = new FormData();
      formData.append('image', file);
      formData.append('imageDataUrl', imageDataUrl);
      formData.append('model', selectedModel);
      if (forceReprocess) {
        formData.append('forceReprocess', 'true');
      }

      const response = await fetch('/api/extract-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process receipt');
      }

      const data = await response.json();
      
      // Check if duplicate was detected
      if (data.duplicate && !forceReprocess) {
        setDuplicateReceipt(data.receipt);
        return;
      }
      
      onReceiptExtracted(data.receipt);
      setPendingFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseExisting = () => {
    if (duplicateReceipt) {
      onReceiptExtracted(duplicateReceipt);
      setDuplicateReceipt(null);
      setPendingFile(null);
    }
  };

  const handleReprocess = async () => {
    if (pendingFile) {
      setDuplicateReceipt(null);
      await processReceipt(pendingFile, true);
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
          onChange={(e) => setSelectedModel(e.target.value as 'openai' | 'anthropic')}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          disabled={isProcessing}
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
          isProcessing
            ? 'border-zinc-400 bg-zinc-50 dark:bg-zinc-900 cursor-not-allowed'
            : isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-500'
            : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isProcessing ? (
            <>
              <Loader2 className="w-12 h-12 mb-4 text-zinc-500 animate-spin" />
              <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Processing receipt...</span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Extracting data with AI vision
              </p>
            </>
          ) : preview ? (
            <div className="relative w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-52 mx-auto object-contain"
              />
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mb-4 text-zinc-500" />
              <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Click to upload receipt</span> or drag and drop
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                PNG, JPG, HEIC up to 10MB
              </p>
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isProcessing}
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
                This receipt has already been uploaded on{' '}
                {new Date(duplicateReceipt.date).toLocaleDateString()}. 
                Would you like to use the existing data or reprocess with AI?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUseExisting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  Use Existing Data
                </button>
                <button
                  onClick={handleReprocess}
                  className="px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Reprocess with AI'}
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
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error</p>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
