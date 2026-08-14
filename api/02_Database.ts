function getDatabase() {
  const spreadsheetId = getRequiredScriptProperty(
    "SPREADSHEET_ID",
  );

  return SpreadsheetApp.openById(spreadsheetId);
}

function getDatabaseSheet(sheetName) {
  const spreadsheet = getDatabase();

  const sheet =
    spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      `Sheet "${sheetName}" tidak ditemukan.`,
    );
  }

  return sheet;
}

function getRequiredScriptProperty(key) {
  const value =
    PropertiesService.getScriptProperties().getProperty(
      key,
    );

  if (!value) {
    throw new Error(
      `Script Property "${key}" belum dikonfigurasi.`,
    );
  }

  return value;
}

/**
 * Jalankan SATU KALI dari Apps Script editor.
 *
 * Script harus dibuat dari:
 * Spreadsheet → Extensions → Apps Script.
 */
function setupProject() {
  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error(
      "Spreadsheet aktif tidak ditemukan. Buka Apps Script melalui Extensions → Apps Script dari Finance Request Database.",
    );
  }

  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: spreadsheet.getId(),
  });

  const result = {
    app: APP_CONFIG.appName,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetName: spreadsheet.getName(),
  };

  console.log(
    JSON.stringify(result, null, 2),
  );

  return result;
}

function validateDatabaseSchema() {
  const spreadsheet = getDatabase();

  const results = [];

  Object.keys(DATABASE_SCHEMA).forEach(function (sheetName) {
    const expectedHeaders = DATABASE_SCHEMA[sheetName];

    const sheet =
      spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      results.push({
        sheet: sheetName,
        valid: false,
        reason: "Sheet tidak ditemukan.",
        missingHeaders: expectedHeaders,
        unexpectedHeaders: [],
      });

      return;
    }

    const actualHeaders =
      getSheetHeaders(sheetName);

    const missingHeaders =
      expectedHeaders.filter(function (header) {
        return !actualHeaders.includes(header);
      });

    const unexpectedHeaders =
      actualHeaders.filter(function (header) {
        return !expectedHeaders.includes(header);
      });

    const orderValid =
      expectedHeaders.length === actualHeaders.length &&
      expectedHeaders.every(function (header, index) {
        return actualHeaders[index] === header;
      });

    results.push({
      sheet: sheetName,
      valid:
        missingHeaders.length === 0 &&
        unexpectedHeaders.length === 0 &&
        orderValid,
      expectedHeaders,
      actualHeaders,
      missingHeaders,
      unexpectedHeaders,
      orderValid,
    });
  });

  const result = {
    valid: results.every(function (item) {
      return item.valid;
    }),
    sheets: results,
  };

  console.log(
    JSON.stringify(result, null, 2),
  );

  return result;
}