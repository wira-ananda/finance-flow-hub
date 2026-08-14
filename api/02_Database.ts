interface SchemaValidationItem {
  sheet: string;
  valid: boolean;
  reason?: string;
  expectedHeaders?: string[];
  actualHeaders?: string[];
  missingHeaders: string[];
  unexpectedHeaders: string[];
  orderValid?: boolean;
}

interface SchemaValidationResult {
  valid: boolean;
  sheets: SchemaValidationItem[];
}

function getDatabase(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const spreadsheetId = getRequiredScriptProperty("SPREADSHEET_ID");

  return SpreadsheetApp.openById(spreadsheetId);
}

function getDatabaseSheet(
  sheetName: string,
): GoogleAppsScript.Spreadsheet.Sheet {
  const spreadsheet = getDatabase();

  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" tidak ditemukan.`);
  }

  return sheet;
}

function getRequiredScriptProperty(key: string): string {
  const value = PropertiesService.getScriptProperties().getProperty(key);

  if (!value) {
    throw new Error(`Script Property "${key}" belum dikonfigurasi.`);
  }

  return value;
}

/**
 * Menyimpan Spreadsheet ID ke Script Properties.
 * Jalankan sekali dari Apps Script editor.
 */
function setupProject(): {
  app: string;
  spreadsheetId: string;
  spreadsheetName: string;
} {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

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

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function validateDatabaseSchema(): SchemaValidationResult {
  const spreadsheet = getDatabase();

  const results: SchemaValidationItem[] = [];

  const sheetNames = Object.keys(DATABASE_SCHEMA) as Array<
    keyof typeof DATABASE_SCHEMA
  >;

  sheetNames.forEach((sheetName) => {
    const expectedHeaders = DATABASE_SCHEMA[sheetName];

    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      results.push({
        sheet: sheetName,
        valid: false,
        reason: "Sheet tidak ditemukan.",
        expectedHeaders,
        actualHeaders: [],
        missingHeaders: expectedHeaders,
        unexpectedHeaders: [],
        orderValid: false,
      });

      return;
    }

    const actualHeaders = getSheetHeaders(sheetName);

    const missingHeaders = expectedHeaders.filter(
      (header: string) => !actualHeaders.includes(header),
    );

    const unexpectedHeaders = actualHeaders.filter(
      (header: string) => !expectedHeaders.includes(header),
    );

    const orderValid =
      expectedHeaders.length === actualHeaders.length &&
      expectedHeaders.every(
        (header: string, index: number) => actualHeaders[index] === header,
      );

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

  const result: SchemaValidationResult = {
    valid: results.every((item: SchemaValidationItem) => item.valid),
    sheets: results,
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}
