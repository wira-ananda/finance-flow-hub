import { useState } from "react";

import { FileUpload, type FileUploadItem } from "@/components/common/FileUpload";
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
import { formatRupiah } from "@/lib/formatters";
import type { FinanceRequest } from "@/types";
import type { ProcessPaymentInput } from "@/services/payment.service";

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

    if (proof.length === 0) {
      setError("Bukti transfer wajib dilampirkan.");

      return;
    }

    if (!/\.(pdf|jpe?g)$/i.test(proof[0]!.name)) {
      setError("Bukti transfer harus berupa PDF, JPG, atau JPEG.");

      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await onConfirm({
        amount: numericAmount,

        paymentDate,

        referenceNumber: referenceNumber.trim(),

        proof: proof[0]!,
      });

      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              hint="Format PDF, JPG, atau JPEG. Maksimal 10 MB."
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
