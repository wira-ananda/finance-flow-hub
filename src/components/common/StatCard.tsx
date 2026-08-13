import { cn } from "@/lib/utils";
import type { DashboardStat } from "@/types";

const TONE_CLASSES: Record<DashboardStat["tone"], string> = {
  neutral: "text-foreground",
  primary: "text-primary",
  warning: "text-status-revision",
  success: "text-status-approved",
  danger: "text-status-rejected",
};

interface StatCardProps {
  stat: DashboardStat;
  className?: string;
}

export function StatCard({ stat, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-card transition-colors hover:border-border-strong",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {stat.label}
      </p>
      <p className={cn("num mt-2 text-2xl font-semibold", TONE_CLASSES[stat.tone])}>
        {stat.value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
    </div>
  );
}
