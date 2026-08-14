import { MOCK_REQUESTS } from "@/data/mock/requests";
import type { FinanceRequest } from "@/types";

const STORAGE_KEY = "frms-mock-requests-v1";

type RequestStoreListener = () => void;

const listeners = new Set<RequestStoreListener>();

/**
 * Membuat salinan request dan menormalisasi struktur data lama.
 */
function cloneRequests(requests: FinanceRequest[]): FinanceRequest[] {
  return requests.map((request) => ({
    ...request,
    payment: request.payment ? { ...request.payment } : null,
    documents: (request.documents ?? []).map((document) => ({
      ...document,
    })),
    activities: (request.activities ?? []).map((activity) => ({
      ...activity,
    })),
  }));
}

const serverSnapshot = cloneRequests(MOCK_REQUESTS);

let browserSnapshot: FinanceRequest[] | null = null;

function readStoredRequests(): FinanceRequest[] {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }

  if (browserSnapshot) {
    return browserSnapshot;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    browserSnapshot = cloneRequests(MOCK_REQUESTS);
    return browserSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      throw new Error("Format mock request tidak valid.");
    }

    browserSnapshot = cloneRequests(parsed as FinanceRequest[]);

    return browserSnapshot;
  } catch {
    browserSnapshot = cloneRequests(MOCK_REQUESTS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));

    return browserSnapshot;
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function persistRequests(requests: FinanceRequest[]): void {
  browserSnapshot = requests;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  }

  emitChange();
}

export function getMockRequestSnapshot(): FinanceRequest[] {
  return readStoredRequests();
}

export function getMockRequestServerSnapshot(): FinanceRequest[] {
  return serverSnapshot;
}

export function subscribeMockRequests(listener: RequestStoreListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function insertMockRequest(request: FinanceRequest): FinanceRequest {
  persistRequests([...getMockRequestSnapshot(), request]);

  return request;
}

export function updateMockRequest(
  requestId: string,
  updater: (request: FinanceRequest) => FinanceRequest,
): FinanceRequest | undefined {
  const current = getMockRequestSnapshot();

  const existing = current.find((request) => request.id === requestId);

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);

  persistRequests(current.map((request) => (request.id === requestId ? updated : request)));

  return updated;
}

export function resetMockRequests(): void {
  persistRequests(cloneRequests(MOCK_REQUESTS));
}
