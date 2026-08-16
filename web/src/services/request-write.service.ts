import { apiPost } from "@/lib/api/client";
import { mapApiFinancialRequest } from "@/lib/api/mappers";

import type { FinanceRequest, RequestCategory, User } from "@/types";
import type {
  ApiCreateRequestPayload,
  ApiFinancialRequestRecord,
  ApiRequestInput,
} from "@/types/finance-api";

export interface CreateRequestInput {
  title: string;
  description: string;

  category: RequestCategory;

  amount: number;

  beneficiaryName: string;

  beneficiaryBank: string;

  beneficiaryAccount: string;

  neededAt: string;
}

export type UpdateRequestInput = CreateRequestInput;

function assertUnitUser(user: User): void {
  if (user.role !== "UNIT_USER" || !user.active || !user.businessUnitId) {
    throw new Error("Hanya pengguna Unit Bisnis aktif yang dapat membuat pengajuan.");
  }
}

function normalizeInput(input: CreateRequestInput | UpdateRequestInput): ApiRequestInput {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    amount: Number(input.amount) || 0,
    beneficiaryName: input.beneficiaryName.trim(),
    beneficiaryBank: input.beneficiaryBank.trim(),
    beneficiaryAccount: input.beneficiaryAccount.trim(),
    neededAt: input.neededAt,
  };
}

/**
 * Membuat request sebagai DRAFT melalui Finance API.
 */
export async function saveDraftRequest(
  user: User,
  input: CreateRequestInput,
): Promise<FinanceRequest> {
  assertUnitUser(user);

  const payload: ApiCreateRequestPayload = {
    ...normalizeInput(input),
    submitNow: false,
  };

  const record = await apiPost<
    ApiFinancialRequestRecord,
    {
      actorId: string;
      request: ApiCreateRequestPayload;
    }
  >("requests.create", {
    actorId: user.id,
    request: payload,
  });

  return mapApiFinancialRequest(record, [user]);
}

/**
 * Memperbarui request DRAFT atau REVISION_REQUIRED melalui Finance API.
 */
export async function updateRequest(
  user: User,
  requestId: string,
  input: UpdateRequestInput,
): Promise<FinanceRequest> {
  assertUnitUser(user);

  const record = await apiPost<
    ApiFinancialRequestRecord,
    {
      actorId: string;
      id: string;
      request: ApiRequestInput;
    }
  >("requests.update", {
    actorId: user.id,
    id: requestId,
    request: normalizeInput(input),
  });

  return mapApiFinancialRequest(record, [user]);
}

/**
 * Submit atau resubmit request melalui Finance API.
 */
export async function submitRequest(user: User, requestId: string): Promise<FinanceRequest> {
  assertUnitUser(user);

  const record = await apiPost<
    ApiFinancialRequestRecord,
    {
      actorId: string;
      id: string;
    }
  >("requests.submit", {
    actorId: user.id,
    id: requestId,
  });

  return mapApiFinancialRequest(record, [user]);
}
