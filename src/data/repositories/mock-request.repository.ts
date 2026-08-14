import { MOCK_REQUESTS } from "@/data/mock/requests";
import type { FinanceRequest } from "@/types";

const STORAGE_KEY = "frms-mock-requests-v1";

type RequestStoreListener = () => void;

const listeners = new Set<RequestStoreListener>();

/**
 * Membuat salinan seed request agar mock data asli tidak termutasi.
 */
function cloneRequests(requests: FinanceRequest[]): FinanceRequest[] {
  return requests.map((request) => ({
    ...request,
    documents: request.documents.map((document) => ({
      ...document,
    })),
    activities: request.activities.map((activity) => ({
      ...activity,
    })),
  }));
}

const serverSnapshot = cloneRequests(MOCK_REQUESTS);

let browserSnapshot: FinanceRequest[] | null = null;

/**
 * Membaca snapshot mock request dari localStorage.
 */
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
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      throw new Error("Format mock request tidak valid.");
    }

    browserSnapshot = parsed as FinanceRequest[];
    return browserSnapshot;
  } catch {
    browserSnapshot = cloneRequests(MOCK_REQUESTS);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(browserSnapshot),
    );

    return browserSnapshot;
  }
}

/**
 * Memberi tahu subscriber bahwa mock request telah berubah.
 */
function emitChange() {
  listeners.forEach((listener) => listener());
}

/**
 * Menyimpan seluruh snapshot mock request.
 */
function persistRequests(requests: FinanceRequest[]) {
  browserSnapshot = requests;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(requests),
    );
  }

  emitChange();
}

/**
 * Snapshot untuk client.
 */
export function getMockRequestSnapshot(): FinanceRequest[] {
  return readStoredRequests();
}

/**
 * Snapshot stabil untuk SSR.
 */
export function getMockRequestServerSnapshot(): FinanceRequest[] {
  return serverSnapshot;
}

/**
 * Subscribe perubahan mock request.
 */
export function subscribeMockRequests(
  listener: RequestStoreListener,
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Menambahkan pengajuan baru ke mock repository.
 */
export function insertMockRequest(
  request: FinanceRequest,
): FinanceRequest {
  const current = getMockRequestSnapshot();

  persistRequests([
    ...current,
    request,
  ]);

  return request;
}

/**
 * Memperbarui satu mock request secara immutable.
 */
export function updateMockRequest(
  requestId: string,
  updater: (request: FinanceRequest) => FinanceRequest,
): FinanceRequest | undefined {
  const current = getMockRequestSnapshot();

  const existing = current.find(
    (request) => request.id === requestId,
  );

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);

  persistRequests(
    current.map((request) =>
      request.id === requestId
        ? updated
        : request,
    ),
  );

  return updated;
}

/**
 * Mengembalikan mock request ke seed awal dari Lovable.
 */
export function resetMockRequests() {
  persistRequests(
    cloneRequests(MOCK_REQUESTS),
  );
}