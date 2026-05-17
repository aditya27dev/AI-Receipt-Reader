"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, CheckCircle2, AlertCircle, X, Eye, EyeOff } from "lucide-react";
import { useApiKey } from "@/lib/api-key-context";
import { Button } from "@/components/ui/button";

const VERCEL_MODE = process.env.NEXT_PUBLIC_VERCEL_MODE === "true";

export function ApiKeyBanner() {
  const { apiKey, setApiKey } = useApiKey();
  const [input, setInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [masked, setMasked] = useState(true);
  const [error, setError] = useState("");

  if (!VERCEL_MODE) return null;

  const handleApply = () => {
    const trimmed = input.trim();
    if (!trimmed.startsWith("sk-") || trimmed.length < 20) {
      setError("Must be a valid OpenAI key starting with sk-");
      return;
    }
    setApiKey(trimmed);
    setInput("");
    setError("");
    setShowInput(false);
  };

  const handleClear = () => {
    setApiKey("");
    setError("");
  };

  return (
    <AnimatePresence mode="wait">
      {apiKey ? (
        <motion.div
          key="active"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-emerald-500/20 bg-emerald-500/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>OpenAI key active — valid for this session only</span>
            </div>
            <button
              onClick={handleClear}
              className="text-emerald-500/60 hover:text-emerald-400 transition-colors"
              aria-label="Clear API key"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-amber-500/20 bg-amber-500/5"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm shrink-0">
              <Key className="w-3.5 h-3.5 shrink-0" />
              <span>Bring your own OpenAI key to use this demo</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              {showInput ? (
                <>
                  <div className="relative">
                    <input
                      type={masked ? "password" : "text"}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleApply()}
                      placeholder="sk-..."
                      className="h-7 w-56 rounded-lg bg-white/5 border border-white/10 text-white text-xs px-3 pr-8 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setMasked((m) => !m)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      tabIndex={-1}
                    >
                      {masked ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    className="h-7 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/50"
                  >
                    Apply
                  </Button>
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setError("");
                    }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowInput(true)}
                  className="h-7 px-3 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/50"
                >
                  Enter key
                </Button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
