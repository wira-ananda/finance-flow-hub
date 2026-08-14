import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

type ReviewDialogType = "revision" | "reject";

interface ReviewActionDialogProps {
  open: boolean;
  type: ReviewDialogType | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => boolean | Promise<boolean>;
}

const DIALOG_CONFIG = {
  revision: {
    title: "Minta Revisi",
    description: "Jelaskan informasi atau dokumen yang harus diperbaiki oleh Unit Bisnis.",
    label: "Catatan Revisi",
    placeholder: "Contoh: Mohon lampirkan faktur pajak dan rincian biaya...",
    confirmLabel: "Kirim Permintaan Revisi",
  },

  reject: {
    title: "Tolak Pengajuan",
    description:
      "Pengajuan yang ditolak dianggap selesai untuk request ini. Masukkan alasan penolakan yang jelas.",
    label: "Alasan Penolakan",
    placeholder: "Contoh: Pengajuan melebihi pagu anggaran unit...",
    confirmLabel: "Tolak Pengajuan",
  },
} as const;

export function ReviewActionDialog({
  open,
  type,
  onOpenChange,
  onConfirm,
}: ReviewActionDialogProps) {
  const [note, setNote] = useState("");

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!type) {
    return null;
  }

  const config = DIALOG_CONFIG[type];

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      setNote("");
      setError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleConfirm = async (event: React.MouseEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cleanNote = note.trim();

    if (!cleanNote) {
      setError(
        type === "revision" ? "Catatan revisi wajib diisi." : "Alasan penolakan wajib diisi.",
      );

      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await onConfirm(cleanNote);

      if (!success) {
        return;
      }

      setNote("");
      setError(null);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="border-border bg-popover">
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>

          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label htmlFor="review-note" className="text-sm font-medium text-foreground">
            {config.label}
            <span className="text-destructive"> *</span>
          </label>

          <Textarea
            id="review-note"
            rows={5}
            value={note}
            disabled={isSubmitting}
            onChange={(event) => {
              setNote(event.target.value);

              if (error) {
                setError(null);
              }
            }}
            placeholder={config.placeholder}
          />

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>

          <AlertDialogAction
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={
              type === "reject"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary-hover"
            }
          >
            {isSubmitting ? "Memproses..." : config.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
