import { FileUpload } from "@/components/common/FileUpload";
import { FormField } from "@/components/common/FormField";
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
import type {
  RequestFormErrors,
  RequestFormFieldSetter,
  RequestFormValues,
} from "@/hooks/use-request-form";
import { formatRupiah } from "@/lib/formatters";
import type { RequestCategory } from "@/types";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as RequestCategory[];

interface RequestSectionProps {
  values: RequestFormValues;
  errors: RequestFormErrors;
  setField: RequestFormFieldSetter;
  disabled: boolean;
}

export function RequestDetailsSection({ values, errors, setField, disabled }: RequestSectionProps) {
  const numericAmount = Number(values.amount.replace(/\D/g, ""));

  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Detail Pengajuan</h2>

      <FormField label="Judul Pengajuan" htmlFor="title" required error={errors.title}>
        <Input
          id="title"
          value={values.title}
          disabled={disabled}
          onChange={(event) => setField("title", event.target.value)}
          placeholder="Contoh: Pembayaran Servis Armada Bulan Agustus"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Kategori" required>
          <Select
            value={values.category}
            disabled={disabled}
            onValueChange={(value) => setField("category", value as RequestCategory)}
          >
            <SelectTrigger>
              <SelectValue />
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
          error={errors.amount}
          hint={numericAmount > 0 ? formatRupiah(numericAmount) : "Masukkan angka tanpa titik."}
        >
          <Input
            id="amount"
            inputMode="numeric"
            value={values.amount}
            disabled={disabled}
            onChange={(event) => setField("amount", event.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="num"
          />
        </FormField>
      </div>

      <FormField
        label="Deskripsi & Justifikasi"
        htmlFor="description"
        required
        error={errors.description}
      >
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          disabled={disabled}
          onChange={(event) => setField("description", event.target.value)}
          placeholder="Jelaskan kebutuhan, urgensi, dan rincian penggunaan dana."
        />
      </FormField>

      <FormField label="Tanggal Dana Dibutuhkan" htmlFor="needed" required error={errors.neededAt}>
        <Input
          id="needed"
          type="date"
          value={values.neededAt}
          disabled={disabled}
          onChange={(event) => setField("neededAt", event.target.value)}
        />
      </FormField>
    </section>
  );
}

export function BeneficiarySection({ values, errors, setField, disabled }: RequestSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold text-foreground">Informasi Penerima</h2>

      <FormField
        label="Nama Penerima"
        htmlFor="beneficiary"
        required
        error={errors.beneficiaryName}
      >
        <Input
          id="beneficiary"
          value={values.beneficiaryName}
          disabled={disabled}
          onChange={(event) => setField("beneficiaryName", event.target.value)}
          placeholder="Nama vendor atau karyawan"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Bank" htmlFor="bank" required error={errors.beneficiaryBank}>
          <Input
            id="bank"
            value={values.beneficiaryBank}
            disabled={disabled}
            onChange={(event) => setField("beneficiaryBank", event.target.value)}
            placeholder="Contoh: Bank Mandiri"
          />
        </FormField>

        <FormField
          label="Nomor Rekening"
          htmlFor="account"
          required
          error={errors.beneficiaryAccount}
        >
          <Input
            id="account"
            value={values.beneficiaryAccount}
            disabled={disabled}
            onChange={(event) => setField("beneficiaryAccount", event.target.value)}
            className="num"
            placeholder="1234567890"
          />
        </FormField>
      </div>
    </section>
  );
}

export function AttachmentsSection({
  values,
  setField,
  disabled,
}: Pick<RequestSectionProps, "values" | "setField" | "disabled">) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-card">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Dokumen Pendukung</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Tambahkan invoice, quotation, kwitansi, atau dokumen pendukung lainnya.
        </p>
      </div>

      <FileUpload
        value={values.attachments}
        onChange={(files) => setField("attachments", files)}
        disabled={disabled}
      />
    </section>
  );
}

interface RequestSummaryProps {
  requesterName: string;
  unitName: string;
  amount: number;
  attachmentCount: number;
  isRevision: boolean;
  isEditMode: boolean;
  disabled: boolean;
  onSaveDraft: () => void;
}

export function RequestSummary({
  requesterName,
  unitName,
  amount,
  attachmentCount,
  isRevision,
  isEditMode,
  disabled,
  onSaveDraft,
}: RequestSummaryProps) {
  return (
    <aside className="space-y-4">
      <section className="surface-emphasis space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Ringkasan</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Pemohon</span>
            <span className="text-right font-medium text-foreground">{requesterName}</span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Unit Bisnis</span>
            <span className="text-right font-medium text-foreground">{unitName}</span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Dokumen</span>
            <span className="num font-medium text-foreground">{attachmentCount}</span>
          </div>

          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <span className="text-muted-foreground">Nominal</span>
            <span className="num text-right font-semibold text-foreground">
              {formatRupiah(amount)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" disabled={disabled} className="bg-primary hover:bg-primary-hover">
            {isRevision ? "Ajukan Ulang" : "Ajukan ke Finance"}
          </Button>

          {!isRevision ? (
            <Button type="button" variant="outline" disabled={disabled} onClick={onSaveDraft}>
              {isEditMode ? "Simpan Perubahan" : "Simpan sebagai Draf"}
            </Button>
          ) : null}
        </div>
      </section>

      <p className="px-1 text-xs leading-5 text-muted-foreground">
        Setelah diajukan, status berubah menjadi Diajukan dan masuk ke antrean review Finance.
      </p>
    </aside>
  );
}
