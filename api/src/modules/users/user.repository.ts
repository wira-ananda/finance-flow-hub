function mapUserRecord(record: SheetRecord): UserRecord {
  return {
    id: String(record.id ?? ""),

    name: String(record.name ?? ""),

    email: String(record.email ?? ""),

    business_unit_id: String(record.business_unit_id ?? ""),

    role: String(record.role ?? "") as UserRole,

    job_title: String(record.job_title ?? ""),

    is_active: normalizeBoolean(record.is_active),

    created_at: String(record.created_at ?? ""),

    updated_at: String(record.updated_at ?? ""),
  };
}

function listUserRecords(): UserRecord[] {
  return getAllRows(APP_CONFIG.sheets.users).map(mapUserRecord);
}

function findUserRecordById(userId: string): UserRecord | null {
  const record = findRowById(APP_CONFIG.sheets.users, userId);

  return record ? mapUserRecord(record) : null;
}

function findUserRecordByEmail(email: string): UserRecord | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();

  return (
    listUserRecords().find(
      (user) => user.email.trim().toLowerCase() === normalizedEmail,
    ) ?? null
  );
}

function insertUserRecord(user: UserRecord): UserRecord {
  appendRecord(APP_CONFIG.sheets.users, user as unknown as SheetRecord);

  return user;
}

function updateUserRecord(
  userId: string,
  changes: Partial<UserRecord>,
): UserRecord {
  const updated = updateRecordById(
    APP_CONFIG.sheets.users,
    userId,
    changes as SheetRecord,
  );

  if (!updated) {
    throw createDomainError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");
  }

  return mapUserRecord(updated);
}

function listActiveUserRecords(): UserRecord[] {
  return listUserRecords().filter((user) => user.is_active);
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
