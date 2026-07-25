import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "bg-emerald-600 text-white hover:bg-emerald-500",
        variant === "outline" &&
          "border border-zinc-700 bg-transparent hover:bg-zinc-800",
        variant === "ghost" && "hover:bg-zinc-800",
        size === "default" && "h-10 px-4 py-2 text-sm",
        size === "sm" && "h-8 px-3 text-xs",
        size === "lg" && "h-11 px-6 text-base",
        className
      )}
      {...props}
    />
  );
}
