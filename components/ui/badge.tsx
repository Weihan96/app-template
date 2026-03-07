import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--secondary)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--secondary-foreground)]",
        className
      )}
      {...props}
    />
  );
}
