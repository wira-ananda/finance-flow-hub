function listBusinessUnitRecords(): SheetRecord[] {
  return getAllRows(APP_CONFIG.sheets.businessUnits);
}

function findBusinessUnitRecordById(
  businessUnitId: string,
): SheetRecord | null {
  return findRowById(APP_CONFIG.sheets.businessUnits, businessUnitId);
}

function listActiveBusinessUnitRecords(): SheetRecord[] {
  return listBusinessUnitRecords().filter((unit) =>
    normalizeBoolean(unit.is_active),
  );
}
