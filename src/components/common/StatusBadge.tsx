import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/constants/status";
import type { RequestStatus } from "@/types";

const STATUS_CLASSES: Record<RequestStatus, string> = {
  DRAFT: "text-status-draft border-status-draft/35 bg-status-draft/10",
  SUBMITTED: "text-status-submitted border-status-submitted/35 bg-status-submitted/10",
  UNDER_REVIEW: "text-status-review border-status-review/35 bg-status-review/10",
  REVISION_REQUIRED: "text-status-revision border-status-revision/35 bg-status-revision/10",
  REJECTED: "text-status-rejected border-status-rejected/35 bg-status-rejected/10",
  APPROVED: "text-status-approved border-status-approved/35 bg-status-approved/10",
  PAID: "text-status-paid border-status-paid/35 bg-status-paid/10",
};

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
