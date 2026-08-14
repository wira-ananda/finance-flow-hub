type SheetRecord = Record<string, unknown>;

function getSheetHeaders(sheetName: string): string[] {
  const sheet = getDatabaseSheet(sheetName);

  const lastColumn = sheet.getLastColumn();

  if (lastColumn === 0) {
    return [];
  }

  return sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map((header) => String(header).trim());
}

function getAllRows(sheetName: string): SheetRecord[] {
  const sheet = getDatabaseSheet(sheetName);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow <= 1 || lastColumn === 0) {
    return [];
  }

  const headers = getSheetHeaders(sheetName);

  const rows = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

  return rows
    .filter((row) => row.some((value) => value !== ""))
    .map((row) => rowToObject(headers, row));
}

function getRowsByField(
  sheetName: string,
  field: string,
  value: unknown,
): SheetRecord[] {
  return getAllRows(sheetName).filter(
    (row) => String(row[field] ?? "") === String(value ?? ""),
  );
}

function findRowById(sheetName: string, id: string): SheetRecord | null {
  if (!id) {
    return null;
  }

  return (
    getAllRows(sheetName).find((row) => String(row.id) === String(id)) ?? null
  );
}

function findSheetRowIndexById(sheetName: string, id: string): number | null {
  const sheet = getDatabaseSheet(sheetName);
  const headers = getSheetHeaders(sheetName);

  const idColumnIndex = headers.indexOf("id");

  if (idColumnIndex === -1) {
    throw new Error(`Sheet "${sheetName}" tidak memiliki kolom id.`);
  }

  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return null;
  }

  const values = sheet
    .getRange(2, idColumnIndex + 1, lastRow - 1, 1)
    .getValues();

  const offset = values.findIndex((row) => String(row[0]) === String(id));

  if (offset === -1) {
    return null;
  }

  return offset + 2;
}

function appendRecord(sheetName: string, record: SheetRecord): SheetRecord {
  const sheet = getDatabaseSheet(sheetName);
  const headers = getSheetHeaders(sheetName);

  const row = objectToRow(headers, record);

  sheet.appendRow(row);

  return {
    ...record,
  };
}

function updateRecordById(
  sheetName: string,
  id: string,
  changes: SheetRecord,
): SheetRecord | null {
  const sheet = getDatabaseSheet(sheetName);

  const rowIndex = findSheetRowIndexById(sheetName, id);

  if (!rowIndex) {
    return null;
  }

  const headers = getSheetHeaders(sheetName);

  const currentValues = sheet
    .getRange(rowIndex, 1, 1, headers.length)
    .getValues()[0];

  const currentRecord = rowToObject(headers, currentValues);

  const updatedRecord = {
    ...currentRecord,
    ...changes,
    id: currentRecord.id,
  };

  const row = objectToRow(headers, updatedRecord);

  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);

  return updatedRecord;
}

function rowToObject(headers: string[], row: unknown[]): SheetRecord {
  return headers.reduce<SheetRecord>((result, header, index) => {
    result[header] = normalizeCellValue(row[index]);

    return result;
  }, {});
}

function objectToRow(headers: string[], record: SheetRecord): unknown[] {
  return headers.map((header) => normalizeWriteValue(record[header]));
}

function normalizeCellValue(value: unknown): unknown {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return (value as Date).toISOString();
  }

  return value;
}

function normalizeWriteValue(value: unknown): unknown {
  if (value === undefined || value === null) {
    return "";
  }

  return value;
}

/**
 * Menjalankan operasi write di dalam script lock.
 *
 * Berguna untuk sequence request number dan
 * workflow update yang memodifikasi beberapa sheet.
 */
function withDatabaseLock<T>(callback: () => T): T {
  const lock = LockService.getScriptLock();

  lock.waitLock(30000);

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}
