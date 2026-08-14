import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { RequestTable } from "@/components/requests/RequestTable";
import { useSession } from "@/providers/session-provider";
import { getDashboardStats, listRequestsByStatus } from "@/services/request.service";

export function ReviewQueuePage() {
  const { user } = useSession();
  const queue = listRequestsByStatus(user, ["SUBMITTED", "UNDER_REVIEW", "REVISION_REQUIRED"]);
  const decided = listRequestsByStatus(user, ["APPROVED", "REJECTED", "PAID"]);
  const stats = getDashboardStats(user);

  return (
    <>
      <PageHeader
        title="Antrean Review"
        description="Pengajuan yang menunggu keputusan tim Finance Reviewer."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Perlu Ditindaklanjuti</h2>
        <RequestTable
          requests={queue}
          showRequester
          emptyTitle="Antrean review kosong"
          emptyDescription="Semua pengajuan sudah ditindaklanjuti."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Sudah Diputuskan</h2>
        <RequestTable
          requests={decided}
          showRequester
          emptyTitle="Belum ada keputusan"
          emptyDescription="Pengajuan yang disetujui atau ditolak akan tampil di sini."
        />
      </section>
    </>
  );
}
