"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorAlertProps {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorAlert({
  error,
  onRetry,
  retryLabel = "Try again",
}: ErrorAlertProps) {
  // Map error messages to user-friendly descriptions
  const getFriendlyMessage = (error: string): string => {
    if (error.includes("Missing ticker")) {
      return "Please enter a valid stock ticker symbol.";
    }
    if (error.includes("Invalid ticker format")) {
      return "Invalid ticker format. Use 1-5 uppercase letters (e.g., AAPL, GOOGL).";
    }
    if (error.includes("Not enough data")) {
      return "We don't have enough historical data for this stock. Try a different ticker.";
    }
    if (error.includes("No historical data found")) {
      return "No historical data found for this ticker. Please verify the symbol.";
    }
    if (error.includes("Unable to fetch stock data")) {
      return "Unable to fetch stock data. Please check the ticker symbol or your internet connection.";
    }
    if (error.includes("Unable to calculate technical indicators")) {
      return "Unable to calculate technical indicators for this stock. Try a different ticker.";
    }
    if (error.includes("unexpected error occurred")) {
      return "An unexpected error occurred. Please try again later.";
    }
    if (error.includes("Network error") || error.includes("Failed to fetch")) {
      return "Unable to connect to the server. Please check your internet connection.";
    }
    return error;
  };

  return (
    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <div className="flex items-start">
        <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
        <div className="flex-1">
          {getFriendlyMessage(error)}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4 mt-2"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}