import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "danger" | "secondary";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-zinc-800 text-zinc-200",
        variant === "success" && "bg-emerald-500/20 text-emerald-400",
        variant === "danger" && "bg-red-500/20 text-red-400",
        variant === "secondary" && "bg-zinc-700 text-zinc-300",
        className
      )}
      {...props}
    />
  );
}
