function getSheetHeaders(sheetName) {
  const sheet =
    getDatabaseSheet(sheetName);

  const lastColumn =
    sheet.getLastColumn();

  if (lastColumn === 0) {
    return [];
  }

  return sheet
    .getRange(
      1,
      1,
      1,
      lastColumn,
    )
    .getValues()[0]
    .map(function (header) {
      return String(header).trim();
    });
}

function getAllRows(sheetName) {
  const sheet =
    getDatabaseSheet(sheetName);

  const lastRow =
    sheet.getLastRow();

  const lastColumn =
    sheet.getLastColumn();

  if (
    lastRow <= 1 ||
    lastColumn === 0
  ) {
    return [];
  }

  const headers =
    getSheetHeaders(sheetName);

  const rows =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        lastColumn,
      )
      .getValues();

  return rows
    .filter(function (row) {
      return row.some(function (value) {
        return value !== "";
      });
    })
    .map(function (row) {
      return rowToObject(
        headers,
        row,
      );
    });
}

function findRowById(
  sheetName,
  id,
) {
  if (!id) {
    return null;
  }

  const rows =
    getAllRows(sheetName);

  return (
    rows.find(function (row) {
      return String(row.id) === String(id);
    }) || null
  );
}

function rowToObject(
  headers,
  row,
) {
  return headers.reduce(
    function (
      result,
      header,
      index,
    ) {
      result[header] =
        normalizeCellValue(
          row[index],
        );

      return result;
    },
    {},
  );
}

function normalizeCellValue(value) {
  if (
    Object.prototype.toString.call(
      value,
    ) === "[object Date]"
  ) {
    return value.toISOString();
  }

  return value;
}