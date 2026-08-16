interface BusinessUnitRecord {
  id: string;
  code: string;
  name: string;
  cost_center: string;
  manager_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessUnitInput {
  code: string;
  name: string;
  costCenter: string;
  managerName: string;
}

function normalizeBusinessUnitInput(
  input: BusinessUnitInput,
): BusinessUnitInput {
  return {
    code: String(input.code ?? "")
      .trim()
      .toUpperCase(),

    name: String(input.name ?? "").trim(),

    costCenter: String(input.costCenter ?? "").trim(),

    managerName: String(input.managerName ?? "").trim(),
  };
}

function assertValidBusinessUnitInput(input: BusinessUnitInput): void {
  if (!input.code || !input.name || !input.costCenter || !input.managerName) {
    throw createDomainError(
      "Kode, nama, cost center, dan nama manajer Unit Bisnis wajib diisi.",
      "VALIDATION_ERROR",
    );
  }

  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(input.code)) {
    throw createDomainError(
      "Kode Unit Bisnis hanya boleh berisi huruf kapital, angka, tanda hubung, atau underscore.",
      "VALIDATION_ERROR",
    );
  }
}

function assertUniqueBusinessUnit(
  input: BusinessUnitInput,
  excludedId = "",
): void {
  const normalizedName = input.name.toLowerCase();

  const duplicate = listBusinessUnitRecords().find((unit) => {
    if (unit.id === excludedId) {
      return false;
    }

    return (
      unit.code.trim().toUpperCase() === input.code ||
      unit.name.trim().toLowerCase() === normalizedName
    );
  });

  if (!duplicate) {
    return;
  }

  if (duplicate.code.trim().toUpperCase() === input.code) {
    throw createDomainError(
      `Kode Unit Bisnis "${input.code}" sudah digunakan.`,
      "BUSINESS_UNIT_CODE_EXISTS",
    );
  }

  throw createDomainError(
    `Nama Unit Bisnis "${input.name}" sudah digunakan.`,
    "BUSINESS_UNIT_NAME_EXISTS",
  );
}

function createBusinessUnitService(
  actorId: string,
  input: BusinessUnitInput,
): BusinessUnitRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "ADMIN");

    const normalized = normalizeBusinessUnitInput(input);

    assertValidBusinessUnitInput(normalized);

    assertUniqueBusinessUnit(normalized);

    const timestamp = nowIso();

    return insertBusinessUnitRecord({
      id: createEntityId("bu"),

      code: normalized.code,

      name: normalized.name,

      cost_center: normalized.costCenter,

      manager_name: normalized.managerName,

      is_active: true,

      created_at: timestamp,

      updated_at: timestamp,
    });
  });
}

function updateBusinessUnitService(
  actorId: string,
  businessUnitId: string,
  input: BusinessUnitInput,
): BusinessUnitRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "ADMIN");

    const current = findBusinessUnitRecordById(businessUnitId);

    if (!current) {
      throw createDomainError(
        "Unit Bisnis tidak ditemukan.",
        "BUSINESS_UNIT_NOT_FOUND",
      );
    }

    const normalized = normalizeBusinessUnitInput(input);

    assertValidBusinessUnitInput(normalized);

    assertUniqueBusinessUnit(normalized, current.id);

    return updateBusinessUnitRecord(current.id, {
      code: normalized.code,

      name: normalized.name,

      cost_center: normalized.costCenter,

      manager_name: normalized.managerName,

      updated_at: nowIso(),
    });
  });
}

function setBusinessUnitActiveService(
  actorId: string,
  businessUnitId: string,
  isActive: boolean,
): BusinessUnitRecord {
  return withDatabaseLock(() => {
    const actor = getActorById(actorId);

    assertActorRole(actor, "ADMIN");

    const current = findBusinessUnitRecordById(businessUnitId);

    if (!current) {
      throw createDomainError(
        "Unit Bisnis tidak ditemukan.",
        "BUSINESS_UNIT_NOT_FOUND",
      );
    }

    if (current.is_active === isActive) {
      return current;
    }

    if (!isActive) {
      const activeAssignedUsers = listActiveUserRecords().filter(
        (user) =>
          user.role === "UNIT_USER" && user.business_unit_id === current.id,
      );

      if (activeAssignedUsers.length > 0) {
        throw createDomainError(
          `Unit Bisnis masih memiliki ${activeAssignedUsers.length} pengguna aktif. Pindahkan atau nonaktifkan pengguna terlebih dahulu.`,
          "BUSINESS_UNIT_HAS_ACTIVE_USERS",
        );
      }
    }

    return updateBusinessUnitRecord(current.id, {
      is_active: isActive,

      updated_at: nowIso(),
    });
  });
}
