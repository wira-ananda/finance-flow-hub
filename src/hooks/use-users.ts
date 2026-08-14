import { useSyncExternalStore } from "react";

import {
  getMockUserServerSnapshot,
  getMockUserSnapshot,
  subscribeMockUsers,
} from "@/data/repositories/mock-user.repository";

export function useUsers() {
  return useSyncExternalStore(subscribeMockUsers, getMockUserSnapshot, getMockUserServerSnapshot);
}
