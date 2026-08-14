import { RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { resetDevelopmentData } from "@/services/dev-data.service";
import type { User } from "@/types";

interface DevelopmentDataSectionProps {
  user: User;
}

export function DevelopmentDataSection({ user }: DevelopmentDataSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [message, setMessage] = useState<string | null>(null);

  const handleReset = (): boolean => {
    setMessage(null);

    try {
      resetDevelopmentData(user);

      setMessage("Data development berhasil dikembalikan ke kondisi awal.");

      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal mereset data development.");

      return false;
    }
  };

  return (
    <>
      <section className="rounded-lg border border-destructive/25 bg-card p-4 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <TriangleAlert className="size-4" aria-hidden />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-foreground">Data Development</h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Kembalikan seluruh pengajuan, pengguna, Unit Bisnis, pembayaran, riwayat, dan
                pengaturan mock ke seed awal.
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Theme dan sesi login development tidak ikut direset.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="destructive"
            className="shrink-0"
            onClick={() => setDialogOpen(true)}
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset Mock Data
          </Button>
        </div>

        {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
      </section>

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Reset seluruh data development?"
        description="Semua perubahan pada pengajuan, review, pembayaran, pengguna, Unit Bisnis, dan pengaturan mock akan dihapus dan dikembalikan ke seed awal."
        confirmLabel="Ya, Reset Data"
        destructive
        onConfirm={handleReset}
      />
    </>
  );
}
