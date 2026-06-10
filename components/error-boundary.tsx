"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] rounded-2xl glass border border-red-500/20 p-8 text-center gap-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <div>
            <p className="text-white font-semibold mb-1">
              Something went wrong
            </p>
            <p className="text-sm text-white/50 max-w-sm">
              {this.state.message}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.reset}
            className="glass border-white/20 text-zinc-300 hover:text-white gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
