import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { useState } from "react";

import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { FileUpload } from "@/components/common/FileUpload";
import { FormField } from "@/components/common/FormField";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS } from "@/constants/status";
import { formatRupiah } from "@/lib/formatters";
import { useSession } from "@/providers/session-provider";
import { getBusinessUnit } from "@/services/user.service";
import type { RequestCategory } from "@/types";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as RequestCategory[];

export function CreateRequestPage() {
  const { user } = useSession();
  const unit = getBusinessUnit(user.businessUnitId);
  const [amount, setAmount] = useState("");
  const [dialog, setDialog] = useState<"draft" | "submit" | null>(null);

  const numericAmount = Number(amount.replace(/\D/g, ""));

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-muted-foreground">
        <Link to="/pengajuan">
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </Link>
      </Button>

      <PageHeader
        title="Buat Pengajuan Keuangan"
        description="Lengkapi informasi pengajuan sebelum dikirim ke tim Finance untuk direview."
      />

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-background-subtle p-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Formulir ini masih menggunakan data contoh. Data yang diisi belum disimpan secara
          permanen pada tahap pengembangan ini.
        </p>
      </div>

      <form
        className="grid gap-4 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setDialog("submit");
        }}
      >
        <div className="space-y-4 lg:col-span-2">
          <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Detail Pengajuan</h2>
            <FormField label="Judul Pengajuan" htmlFor="title" required>
              <Input id="title" placeholder="Contoh: Pembayaran Servis Armada Bulan Agustus" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Kategori" required>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="Nominal Pengajuan"
                htmlFor="amount"
                required
                hint={numericAmount > 0 ? formatRupiah(numericAmount) : "Masukkan angka tanpa titik"}
              >
                <Input
                  id="amount"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  className="num"
                />
              </FormField>
            </div>
            <FormField label="Deskripsi & Justifikasi" htmlFor="description" required>
              <Textarea
                id="description"
                rows={4}
                placeholder="Jelaskan kebutuhan, urgensi, dan rincian penggunaan dana."
              />
            </FormField>
            <FormField label="Tanggal Dana Dibutuhkan" htmlFor="needed" required>
              <Input id="needed" type="date" />
            </FormField>
          </section>

          <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Informasi Penerima</h2>
            <FormField label="Nama Penerima" htmlFor="beneficiary" required>
              <Input id="beneficiary" placeholder="Nama vendor atau karyawan" />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bank" htmlFor="bank" required>
                <Input id="bank" placeholder="Contoh: Bank Mandiri" />
              </FormField>
              <FormField label="Nomor Rekening" htmlFor="account" required>
                <Input id="account" className="num" placeholder="1234567890" />
              </FormField>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
            <h2 className="text-sm font-semibold text-foreground">Dokumen Pendukung</h2>
            <FileUpload />
          </section>
        </div>

        <aside className="space-y-4">
          <section className="surface-emphasis space-y-3 rounded-lg border border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">Ringkasan</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Pemohon</span>
                <span className="text-right font-medium text-foreground">{user.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Unit Bisnis</span>
                <span className="text-right font-medium text-foreground">
                  {unit ? unit.name : "-"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Nominal</span>
                <span className="num text-right font-medium text-foreground">
                  {formatRupiah(numericAmount || 0)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <Button type="submit" className="bg-primary hover:bg-primary-hover">
                Ajukan ke Finance
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialog("draft")}>
                Simpan sebagai Draf
              </Button>
            </div>
          </section>
          <p className="px-1 text-xs text-muted-foreground">
            Setelah diajukan, pengajuan akan masuk ke antrean review tim Finance dan status berubah
            menjadi Diajukan.
          </p>
        </aside>
      </form>

      <ConfirmationDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog === "draft" ? "Simpan sebagai Draf" : "Ajukan ke Finance"}
        description="Aksi ini masih menggunakan data contoh sehingga pengajuan belum benar-benar tersimpan."
        confirmLabel="Mengerti"
        onConfirm={() => setDialog(null)}
      />
    </>
  );
}
