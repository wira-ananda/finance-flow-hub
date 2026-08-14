import { MOCK_USERS } from "@/data/mock/users";
import type { User } from "@/types";

const STORAGE_KEY = "frms-mock-users-v1";

type Listener = () => void;

const listeners = new Set<Listener>();

function cloneUsers(users: User[]): User[] {
  return users.map((user) => ({
    ...user,
    active: user.active ?? true,
  }));
}

const serverSnapshot = cloneUsers(MOCK_USERS);

let browserSnapshot: User[] | null = null;

function readUsers(): User[] {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }

  if (browserSnapshot) {
    return browserSnapshot;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    browserSnapshot = cloneUsers(MOCK_USERS);

    return browserSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      throw new Error("Format mock user tidak valid.");
    }

    browserSnapshot = cloneUsers(parsed as User[]);

    return browserSnapshot;
  } catch {
    browserSnapshot = cloneUsers(MOCK_USERS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));

    return browserSnapshot;
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function persistUsers(users: User[]): void {
  browserSnapshot = cloneUsers(users);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));
  }

  emitChange();
}

export function getMockUserSnapshot(): User[] {
  return readUsers();
}

export function getMockUserServerSnapshot(): User[] {
  return serverSnapshot;
}

export function subscribeMockUsers(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function insertMockUser(user: User): User {
  persistUsers([...getMockUserSnapshot(), user]);

  return user;
}

export function updateMockUser(userId: string, updater: (user: User) => User): User | undefined {
  const current = getMockUserSnapshot();

  const existing = current.find((user) => user.id === userId);

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);

  persistUsers(current.map((user) => (user.id === userId ? updated : user)));

  return updated;
}

export function resetMockUsers(): void {
  persistUsers(cloneUsers(MOCK_USERS));
}
