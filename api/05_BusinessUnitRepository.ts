function listBusinessUnitRecords() {
  return getAllRows(
    APP_CONFIG.sheets.businessUnits,
  );
}

function findBusinessUnitRecordById(
  businessUnitId,
) {
  return findRowById(
    APP_CONFIG.sheets.businessUnits,
    businessUnitId,
  );
}

function listActiveBusinessUnitRecords() {
  return listBusinessUnitRecords().filter(
    function (unit) {
      return normalizeBoolean(
        unit.is_active,
      );
    },
  );
}