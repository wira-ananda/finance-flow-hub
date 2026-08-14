import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { RequestTable } from "@/components/requests/RequestTable";
import { useSession } from "@/providers/session-provider";
import { getDashboardStats, listRequestsByStatus } from "@/services/request.service";

export function PaymentQueuePage() {
  const { user } = useSession();
  const ready = listRequestsByStatus(user, ["APPROVED"]);
  const paid = listRequestsByStatus(user, ["PAID"]);
  const stats = getDashboardStats(user);

  return (
    <>
      <PageHeader
        title="Proses Pembayaran"
        description="Pengajuan yang telah disetujui dan siap diproses pembayarannya."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Siap Dibayar</h2>
        <RequestTable
          requests={ready}
          showRequester
          emptyTitle="Tidak ada pembayaran tertunda"
          emptyDescription="Pengajuan yang disetujui reviewer akan tampil di sini."
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Riwayat Pembayaran</h2>
        <RequestTable
          requests={paid}
          showRequester
          emptyTitle="Belum ada pembayaran"
          emptyDescription="Riwayat pembayaran beserta bukti transfer akan tampil di sini."
        />
      </section>
    </>
  );
}
