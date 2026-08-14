import { updateMockRequest } from "@/data/repositories/mock-request.repository";
import { formatRupiah } from "@/lib/formatters";
import { canPerform } from "@/lib/permissions";
import { assertRequestStatusTransition } from "@/lib/request-status";
import { getRequest } from "@/services/request.service";
import type { FinanceRequest, RequestDocument, User } from "@/types";

export interface PaymentProofInput {
  id?: string;
  name: string;
  sizeKb: number;
}

export interface ProcessPaymentInput {
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  proof: PaymentProofInput;
}

const MAX_PROOF_SIZE_KB = 10 * 1024;
const ALLOWED_PROOF_EXTENSIONS = ["pdf", "jpg", "jpeg"];

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validatePaymentProof(proof: PaymentProofInput): void {
  if (!proof.name.trim()) {
    throw new Error("Bukti transfer wajib dilampirkan.");
  }

  if (!ALLOWED_PROOF_EXTENSIONS.includes(getExtension(proof.name))) {
    throw new Error("Bukti transfer harus berupa PDF, JPG, atau JPEG.");
  }

  if (proof.sizeKb > MAX_PROOF_SIZE_KB) {
    throw new Error("Ukuran bukti transfer maksimal 10 MB.");
  }
}

export function processPayment(
  user: User,
  requestId: string,
  input: ProcessPaymentInput,
): FinanceRequest {
  const existing = getRequest(user, requestId);

  if (!existing) {
    throw new Error("Pengajuan tidak ditemukan.");
  }

  if (!canPerform(user, existing, "PROCESS_PAYMENT")) {
    throw new Error("Pengajuan ini tidak dapat diproses pembayarannya.");
  }

  assertRequestStatusTransition(existing.status, "PAID");

  if (input.amount <= 0) {
    throw new Error("Nominal pembayaran harus lebih besar dari Rp0.");
  }

  if (!input.paymentDate) {
    throw new Error("Tanggal pembayaran wajib diisi.");
  }

  const referenceNumber = input.referenceNumber.trim();

  if (!referenceNumber) {
    throw new Error("Nomor referensi bank wajib diisi.");
  }

  validatePaymentProof(input.proof);

  const timestamp = new Date().toISOString();
  const paidAt = `${input.paymentDate}T00:00:00Z`;

  const proofDocument: RequestDocument = {
    id: input.proof.id ?? createId("doc"),
    name: input.proof.name,
    type: "BUKTI_TRANSFER",
    sizeKb: input.proof.sizeKb,
    uploadedAt: timestamp,
    uploadedBy: user.name,
  };

  const updated = updateMockRequest(requestId, (request) => ({
    ...request,
    status: "PAID",
    paidAt,
    updatedAt: timestamp,
    payment: {
      amount: input.amount,
      paymentDate: input.paymentDate,
      referenceNumber,
      processedBy: user.id,
      processedAt: timestamp,
    },
    documents: [...request.documents, proofDocument],
    activities: [
      ...request.activities,
      {
        id: createId("act"),
        action: "PAID",
        actorName: user.name,
        actorRole: user.role,
        note: `${formatRupiah(input.amount)} dibayarkan dengan referensi ${referenceNumber}.`,
        createdAt: timestamp,
      },
    ],
  }));

  if (!updated) {
    throw new Error("Gagal menyimpan pembayaran.");
  }

  return updated;
}
