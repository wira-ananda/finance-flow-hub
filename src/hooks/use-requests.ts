import {
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  getMockRequestServerSnapshot,
  getMockRequestSnapshot,
  subscribeMockRequests,
} from "@/data/repositories/mock-request.repository";
import {
  getRequest,
  listRequests,
} from "@/services/request.service";
import type {
  FinanceRequest,
  User,
} from "@/types";

/**
 * Membaca daftar request secara reactive dari mock repository.
 */
export function useRequests(
  user: User | null,
): FinanceRequest[] {
  const snapshot = useSyncExternalStore(
    subscribeMockRequests,
    getMockRequestSnapshot,
    getMockRequestServerSnapshot,
  );

  return useMemo(() => {
    if (!user) {
      return [];
    }

    return listRequests(
      user,
      snapshot,
    );
  }, [
    user,
    snapshot,
  ]);
}

/**
 * Membaca satu request secara reactive dari mock repository.
 */
export function useRequest(
  user: User | null,
  requestId: string | null,
): FinanceRequest | undefined {
  const snapshot = useSyncExternalStore(
    subscribeMockRequests,
    getMockRequestSnapshot,
    getMockRequestServerSnapshot,
  );

  return useMemo(() => {
    if (!user || !requestId) {
      return undefined;
    }

    return getRequest(
      user,
      requestId,
      snapshot,
    );
  }, [
    user,
    requestId,
    snapshot,
  ]);
}