import { cn } from "@/lib/utils";

interface LoadingStateProps {
  rows?: number;
  className?: string;
}

export function LoadingState({ rows = 4, className }: LoadingStateProps) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card p-4", className)}
      role="status"
      aria-label="Memuat data"
    >
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Memuat data…</p>
    </div>
  );
}
