interface UserInput {
  name: string;

  email: string;

  role: UserRole;

  jobTitle: string;

  businessUnitId: string | null;
}

/**
 * Seluruh role yang valid di database.
 *
 * ADMIN tetap valid karena sudah ada sebagai bootstrap account,
 * tetapi tidak boleh dibuat atau diberikan lewat User Management.
 */
const VALID_USER_ROLES: UserRole[] = [
  "UNIT_USER",
  "FINANCE_REVIEWER",
  "FINANCE_PAYMENT",
  "ADMIN",
];

/**
 * Role yang boleh dibuat dan dikelola melalui User Management.
 *
 * ADMIN sengaja tidak termasuk.
 */
const MANAGEABLE_USER_ROLES: UserRole[] = [
  "UNIT_USER",
  "FINANCE_REVIEWER",
  "FINANCE_PAYMENT",
];

function normalizeUserInput(input: UserInput): UserInput {
  return {
    name: String(input.name ?? "").trim(),

    email: String(input.email ?? "")
      .trim()
      .toLowerCase(),

    role: String(input.role ?? "") as UserRole,

    jobTitle: String(input.jobTitle ?? "").trim(),

    businessUnitId: input.businessUnitId
      ? String(input.businessUnitId).trim()
      : null,
  };
}

function assertValidUserInput(input: UserInput): void {
  if (!input.name || !input.email || !input.jobTitle) {
    throw createDomainError(
      "Nama, email, dan jabatan pengguna wajib diisi.",
      "VALIDATION_ERROR",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    throw createDomainError(
      "Format email pengguna tidak valid.",
      "INVALID_USER_EMAIL",
    );
  }

  if (!VALID_USER_ROLES.includes(input.role)) {
    throw createDomainError("Role pengguna tidak valid.", "INVALID_USER_ROLE");
  }

  if (input.role === "UNIT_USER" && !input.businessUnitId) {
    throw createDomainError(
      "Unit Bisnis wajib dipilih untuk role Unit Bisnis.",
      "BUSINESS_UNIT_REQUIRED",
    );
  }
}

/**
 * Mencegah pembuatan Administrator baru.
 *
 * Administrator adalah singleton/bootstrap account
 * dan tidak boleh dibuat dari User Management maupun direct API.
 */
function assertCanCreateUserRole(role: UserRole): void {
  if (role === "ADMIN") {
    throw createDomainError(
      "Administrator tidak dapat dibuat melalui User Management.",
      "ADMIN_CREATION_NOT_ALLOWED",
    );
  }

  if (!MANAGEABLE_USER_ROLES.includes(role)) {
    throw createDomainError(
      "Role pengguna tidak dapat dibuat melalui User Management.",
      "INVALID_USER_ROLE",
    );
  }
}

/**
 * Menjaga role Administrator tetap singleton.
 *
 * - ADMIN existing tidak boleh menjadi role lain.
 * - User biasa tidak boleh dipromosikan menjadi ADMIN.
 */
function assertManagedRoleTransition(
  currentRole: UserRole,
  nextRole: UserRole,
): void {
  if (currentRole === "ADMIN" && nextRole !== "ADMIN") {
    throw createDomainError(
      "Role Administrator utama tidak dapat diubah.",
      "ADMIN_ROLE_LOCKED",
    );
  }

  if (currentRole !== "ADMIN" && nextRole === "ADMIN") {
    throw createDomainError(
      "Role Administrator tidak dapat diberikan melalui User Management.",
      "ADMIN_ROLE_ASSIGNMENT_NOT_ALLOWED",
    );
  }

  if (currentRole !== "ADMIN" && !MANAGEABLE_USER_ROLES.includes(nextRole)) {
    throw createDomainError("Role pengguna tidak valid.", "INVALID_USER_ROLE");
  }
}

function assertUniqueUserEmail(email: string, excludedUserId = ""): void {
  const existing = findUserRecordByEmail(email);

  if (!existing) {
    return;
  }

  if (String(existing.id ?? "") === excludedUserId) {
    return;
  }

  throw createDomainError(
    `Email "${email}" sudah terdaftar.`,
    "USER_EMAIL_EXISTS",
  );
}

/**
 * Menentukan Unit Bisnis user berdasarkan role.
 *
 * Hanya UNIT_USER yang memiliki business_unit_id.
 * Role Finance dan ADMIN selalu memakai business_unit_id kosong.
 */
function resolveManagedBusinessUnitId(input: UserInput): string {
  if (input.role !== "UNIT_USER") {
    return "";
  }

  const businessUnitId = input.businessUnitId ?? "";

  if (!businessUnitId) {
    throw createDomainError(
      "Unit Bisnis wajib dipilih untuk role Unit Bisnis.",
      "BUSINESS_UNIT_REQUIRED",
    );
  }

  const businessUnit = findBusinessUnitRecordById(businessUnitId);

  if (!businessUnit) {
    throw createDomainError(
      "Unit Bisnis pengguna tidak ditemukan.",
      "BUSINESS_UNIT_NOT_FOUND",
    );
  }

  if (!normalizeBoolean(businessUnit.is_active)) {
    throw createDomainError(
      "Unit Bisnis pengguna sedang nonaktif.",
      "BUSINESS_UNIT_INACTIVE",
    );
  }

  return businessUnitId;
}

/**
 * Membuat pengguna baru.
 *
 * Hanya ADMIN aktif yang dapat menjalankan operasi ini.
 * Role ADMIN tidak dapat dibuat melalui service ini.
 */
function createUserService(actorId: string, input: UserInput): UserRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "ADMIN");

    const normalized = normalizeUserInput(input);

    assertValidUserInput(normalized);

    assertCanCreateUserRole(normalized.role);

    assertUniqueUserEmail(normalized.email);

    const businessUnitId = resolveManagedBusinessUnitId(normalized);

    const timestamp = nowIso();

    const record: UserRecord = {
      id: createEntityId("usr"),

      name: normalized.name,

      email: normalized.email,

      business_unit_id: businessUnitId,

      role: normalized.role,

      job_title: normalized.jobTitle,

      is_active: true,

      created_at: timestamp,

      updated_at: timestamp,
    };

    insertUserRecord(record);

    return record;
  });
}

/**
 * Memperbarui pengguna existing.
 *
 * ADMIN existing boleh memperbarui profil,
 * tetapi role ADMIN tidak dapat dipindahkan atau diberikan
 * kepada pengguna lain.
 */
function updateUserService(
  actorId: string,
  userId: string,
  input: UserInput,
): UserRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "ADMIN");

    const current = findUserRecordById(userId);

    if (!current) {
      throw createDomainError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");
    }

    const currentRole = String(current.role ?? "") as UserRole;

    const normalized = normalizeUserInput(input);

    assertValidUserInput(normalized);

    assertManagedRoleTransition(currentRole, normalized.role);

    assertUniqueUserEmail(normalized.email, userId);

    const businessUnitId = resolveManagedBusinessUnitId(normalized);

    const updated = updateUserRecord(userId, {
      name: normalized.name,

      email: normalized.email,

      business_unit_id: businessUnitId,

      role: normalized.role,

      job_title: normalized.jobTitle,

      updated_at: nowIso(),
    });

    return updated;
  });
}

/**
 * Mengaktifkan atau menonaktifkan pengguna.
 *
 * Administrator tidak dapat dinonaktifkan karena sistem
 * hanya memiliki satu bootstrap Administrator.
 */
function setUserActiveService(
  actorId: string,
  userId: string,
  isActive: boolean,
): UserRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "ADMIN");

    const current = findUserRecordById(userId);

    if (!current) {
      throw createDomainError("Pengguna tidak ditemukan.", "USER_NOT_FOUND");
    }

    const currentRole = String(current.role ?? "") as UserRole;

    const currentIsActive = normalizeBoolean(current.is_active);

    /*
     * ADMIN adalah singleton bootstrap account.
     * Tidak boleh dinonaktifkan, termasuk melalui direct API.
     */
    if (currentRole === "ADMIN" && !isActive) {
      throw createDomainError(
        "Administrator utama tidak dapat dinonaktifkan.",
        "ADMIN_DEACTIVATION_NOT_ALLOWED",
      );
    }

    if (currentIsActive === isActive) {
      return current as unknown as UserRecord;
    }

    /*
     * UNIT_USER hanya boleh diaktifkan jika Unit Bisnis
     * yang menjadi konteks aksesnya masih aktif.
     */
    if (isActive && currentRole === "UNIT_USER") {
      const businessUnitId = String(current.business_unit_id ?? "").trim();

      if (!businessUnitId) {
        throw createDomainError(
          "Pengguna Unit Bisnis tidak memiliki Unit Bisnis.",
          "BUSINESS_UNIT_REQUIRED",
        );
      }

      const businessUnit = findBusinessUnitRecordById(businessUnitId);

      if (!businessUnit) {
        throw createDomainError(
          "Unit Bisnis pengguna tidak ditemukan.",
          "BUSINESS_UNIT_NOT_FOUND",
        );
      }

      if (!normalizeBoolean(businessUnit.is_active)) {
        throw createDomainError(
          "Pengguna tidak dapat diaktifkan karena Unit Bisnisnya sedang nonaktif.",
          "BUSINESS_UNIT_INACTIVE",
        );
      }
    }

    return updateUserRecord(userId, {
      is_active: isActive,

      updated_at: nowIso(),
    });
  });
}
