function listUserRecords(): SheetRecord[] {
  return getAllRows(APP_CONFIG.sheets.users);
}

function findUserRecordById(userId: string): SheetRecord | null {
  return findRowById(APP_CONFIG.sheets.users, userId);
}

function findUserRecordByEmail(email: string): SheetRecord | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  return (
    listUserRecords().find(
      (user) =>
        String(user.email ?? "")
          .trim()
          .toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

function listActiveUserRecords(): SheetRecord[] {
  return listUserRecords().filter((user) => normalizeBoolean(user.is_active));
}

function normalizeBoolean(value: unknown): boolean {
  if (value === true || value === false) {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return ["true", "1", "yes"].includes(normalized);
}
