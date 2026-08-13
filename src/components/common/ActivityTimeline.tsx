import { cn } from "@/lib/utils";
import { ACTIVITY_LABELS, ROLE_LABELS } from "@/constants/status";
import { formatTanggalWaktu } from "@/lib/formatters";
import type { ActivityAction, ActivityEntry } from "@/types";

const DOT_CLASSES: Record<ActivityAction, string> = {
  CREATED: "bg-status-draft",
  SUBMITTED: "bg-status-submitted",
  REVIEW_STARTED: "bg-status-review",
  REVISION_REQUESTED: "bg-status-revision",
  REJECTED: "bg-status-rejected",
  APPROVED: "bg-status-approved",
  PAID: "bg-status-paid",
  COMMENT: "bg-muted-foreground",
};

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {sorted.map((entry) => (
        <li key={entry.id} className="relative">
          <span
            className={cn(
              "absolute -left-[1.4rem] top-1.5 size-2 rounded-full ring-4 ring-card",
              DOT_CLASSES[entry.action],
            )}
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">{ACTIVITY_LABELS[entry.action]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {entry.actorName} · {ROLE_LABELS[entry.actorRole]} · {formatTanggalWaktu(entry.createdAt)}
          </p>
          {entry.note ? (
            <p className="mt-2 rounded-md border border-border bg-background-subtle px-3 py-2 text-sm text-muted-foreground">
              {entry.note}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
