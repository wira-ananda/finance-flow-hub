import { useState } from "react";

import { FileUpload } from "@/components/common/FileUpload";
import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MAX_WEB_UPLOAD_SIZE_MB } from "@/lib/file-upload";
import { formatRupiah } from "@/lib/formatters";

import type { ProcessPaymentInput } from "@/services/payment.service";
import type { FinanceRequest } from "@/types";
import type { FileUploadItem } from "@/types/files";

interface PaymentDialogProps {
  open: boolean;
  request: FinanceRequest;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: ProcessPaymentInput) => boolean | Promise<boolean>;
}

function getTodayInput(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function PaymentDialog({ open, request, onOpenChange, onConfirm }: PaymentDialogProps) {
  const [amount, setAmount] = useState(String(request.amount));
  const [paymentDate, setPaymentDate] = useState(getTodayInput());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proof, setProof] = useState<FileUploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numericAmount = Number(amount.replace(/\D/g, ""));

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (numericAmount <= 0) {
      setError("Nominal pembayaran wajib diisi.");
      return;
    }

    if (!paymentDate) {
      setError("Tanggal pembayaran wajib diisi.");
      return;
    }

    if (!referenceNumber.trim()) {
      setError("Nomor referensi bank wajib diisi.");
      return;
    }

    if (!proof[0]?.file) {
      setError("Bukti transfer wajib dilampirkan.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await onConfirm({
        amount: numericAmount,
        paymentDate,
        referenceNumber: referenceNumber.trim(),
        proof: proof[0],
      });

      if (success) {
        onOpenChange(false);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Pembayaran gagal diproses.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Proses Pembayaran</DialogTitle>

          <DialogDescription>
            {request.requestNumber}
            {" · "}
            {request.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background-subtle p-3">
            <p className="text-xs text-muted-foreground">Nilai Pengajuan</p>
            <p className="num mt-1 text-lg font-semibold text-foreground">
              {formatRupiah(request.amount)}
            </p>
          </div>

          <FormField
            label="Nominal Pembayaran"
            htmlFor="payment-amount"
            required
            hint={numericAmount > 0 ? formatRupiah(numericAmount) : undefined}
          >
            <Input
              id="payment-amount"
              inputMode="numeric"
              value={amount}
              disabled={isSubmitting}
              onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
              className="num"
            />
          </FormField>

          <FormField label="Tanggal Pembayaran" htmlFor="payment-date" required>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              disabled={isSubmitting}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </FormField>

          <FormField label="Nomor Referensi Bank" htmlFor="reference-number" required>
            <Input
              id="reference-number"
              value={referenceNumber}
              disabled={isSubmitting}
              onChange={(event) => setReferenceNumber(event.target.value)}
              placeholder="Contoh: TRX-20260814-001"
            />
          </FormField>

          <FormField label="Bukti Transfer" required>
            <FileUpload
              value={proof}
              onChange={setProof}
              multiple={false}
              disabled={isSubmitting}
              label="Unggah bukti transfer"
              hint={`Format PDF, JPG, atau JPEG. Maksimal ${MAX_WEB_UPLOAD_SIZE_MB} MB.`}
            />
          </FormField>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>

          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Memproses..." : "Tandai Sudah Dibayar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
