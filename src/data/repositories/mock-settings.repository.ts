import type { SystemSettings } from "@/types";

const STORAGE_KEY = "frms-system-settings-v1";

const DEFAULT_SETTINGS: SystemSettings = {
  emailNotificationsEnabled: true,
  requesterStatusNotificationsEnabled: true,
};

type Listener = () => void;

const listeners = new Set<Listener>();

let browserSnapshot: SystemSettings | null = null;

function cloneSettings(settings: SystemSettings): SystemSettings {
  return {
    ...settings,
  };
}

function normalizeSettings(value: Partial<SystemSettings>): SystemSettings {
  return {
    emailNotificationsEnabled:
      typeof value.emailNotificationsEnabled === "boolean"
        ? value.emailNotificationsEnabled
        : DEFAULT_SETTINGS.emailNotificationsEnabled,

    requesterStatusNotificationsEnabled:
      typeof value.requesterStatusNotificationsEnabled === "boolean"
        ? value.requesterStatusNotificationsEnabled
        : DEFAULT_SETTINGS.requesterStatusNotificationsEnabled,
  };
}

function readSettings(): SystemSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  if (browserSnapshot) {
    return browserSnapshot;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    browserSnapshot = cloneSettings(DEFAULT_SETTINGS);

    return browserSnapshot;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Format settings tidak valid.");
    }

    browserSnapshot = normalizeSettings(parsed as Partial<SystemSettings>);

    return browserSnapshot;
  } catch {
    browserSnapshot = cloneSettings(DEFAULT_SETTINGS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));

    return browserSnapshot;
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

export function getMockSettingsSnapshot(): SystemSettings {
  return readSettings();
}

export function getMockSettingsServerSnapshot(): SystemSettings {
  return DEFAULT_SETTINGS;
}

export function subscribeMockSettings(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function saveMockSettings(settings: SystemSettings): SystemSettings {
  browserSnapshot = normalizeSettings(settings);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));
  }

  emitChange();

  return cloneSettings(browserSnapshot);
}

export function resetMockSettings(): void {
  saveMockSettings(DEFAULT_SETTINGS);
}
