import { apiPost } from "@/lib/api/client";
import { mapApiFinancialRequest } from "@/lib/api/mappers";
import { fileToApiUploadInput } from "@/lib/file-upload";

import type { FinanceRequest, User } from "@/types";
import type { FileUploadItem } from "@/types/files";
import type { ApiFinancialRequestRecord, ApiUploadFileInput } from "@/types/finance-api";

export interface ProcessPaymentInput {
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  proof: FileUploadItem;
}

interface ProcessPaymentBody extends Record<string, unknown> {
  actorId: string;
  id: string;
  payment: {
    amount: number;
    paymentDate: string;
    referenceNumber: string;
    proofFile: ApiUploadFileInput;
  };
}

/**
 * Memproses pembayaran dan mengunggah bukti transfer melalui Finance API.
 */
export async function processPayment(
  user: User,
  requestId: string,
  input: ProcessPaymentInput,
): Promise<FinanceRequest> {
  if (input.amount <= 0) {
    throw new Error("Nominal pembayaran harus lebih besar dari Rp0.");
  }

  if (!input.paymentDate) {
    throw new Error("Tanggal pembayaran wajib diisi.");
  }

  const referenceNumber = input.referenceNumber.trim();

  if (!referenceNumber) {
    throw new Error("Nomor referensi pembayaran wajib diisi.");
  }

  if (!input.proof.file) {
    throw new Error("Bukti pembayaran wajib dipilih ulang.");
  }

  const proofFile = await fileToApiUploadInput(input.proof.file);

  const record = await apiPost<ApiFinancialRequestRecord, ProcessPaymentBody>("payments.process", {
    actorId: user.id,
    id: requestId,
    payment: {
      amount: input.amount,
      paymentDate: input.paymentDate,
      referenceNumber,
      proofFile,
    },
  });

  return mapApiFinancialRequest(record, [user]);
}
