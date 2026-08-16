function mapBusinessUnitRecord(record: SheetRecord): BusinessUnitRecord {
  return {
    id: String(record.id ?? ""),

    code: String(record.code ?? ""),

    name: String(record.name ?? ""),

    cost_center: String(record.cost_center ?? ""),

    manager_name: String(record.manager_name ?? ""),

    is_active: normalizeBoolean(record.is_active),

    created_at: String(record.created_at ?? ""),

    updated_at: String(record.updated_at ?? ""),
  };
}

function listBusinessUnitRecords(): BusinessUnitRecord[] {
  return getAllRows(APP_CONFIG.sheets.businessUnits).map(mapBusinessUnitRecord);
}

function findBusinessUnitRecordById(
  businessUnitId: string,
): BusinessUnitRecord | null {
  const record = findRowById(APP_CONFIG.sheets.businessUnits, businessUnitId);

  return record ? mapBusinessUnitRecord(record) : null;
}

function findBusinessUnitRecordByCode(code: string): BusinessUnitRecord | null {
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return null;
  }

  return (
    listBusinessUnitRecords().find(
      (unit) => unit.code.trim().toUpperCase() === normalizedCode,
    ) ?? null
  );
}

function insertBusinessUnitRecord(
  unit: BusinessUnitRecord,
): BusinessUnitRecord {
  appendRecord(APP_CONFIG.sheets.businessUnits, unit as unknown as SheetRecord);

  return unit;
}

function updateBusinessUnitRecord(
  businessUnitId: string,
  changes: Partial<BusinessUnitRecord>,
): BusinessUnitRecord {
  const updated = updateRecordById(
    APP_CONFIG.sheets.businessUnits,
    businessUnitId,
    changes as SheetRecord,
  );

  if (!updated) {
    throw createDomainError(
      "Unit Bisnis tidak ditemukan.",
      "BUSINESS_UNIT_NOT_FOUND",
    );
  }

  return mapBusinessUnitRecord(updated);
}

function listActiveBusinessUnitRecords(): BusinessUnitRecord[] {
  return listBusinessUnitRecords().filter((unit) => unit.is_active);
}
