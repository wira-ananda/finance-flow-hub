function seedDevelopmentMasterData() {
  seedBusinessUnits();
  seedUsers();

  console.log(
    "Development master data berhasil dibuat.",
  );
}

function seedBusinessUnits() {
  const sheet = getDatabaseSheet(
    APP_CONFIG.sheets.businessUnits,
  );

  if (sheet.getLastRow() > 1) {
    console.log(
      "business_units sudah memiliki data. Seed dilewati.",
    );
    return;
  }

  const timestamp = new Date().toISOString();

  const rows = [
    [
      "bu-01",
      "MAW-LOG",
      "MAW Logistik Nusantara",
      "CC-1001",
      "Manager Logistik",
      true,
      timestamp,
      timestamp,
    ],
    [
      "bu-02",
      "MAW-HOLD",
      "MAW Holding",
      "CC-1002",
      "Manager Holding",
      true,
      timestamp,
      timestamp,
    ],
    [
      "bu-03",
      "MAW-SYARIAH",
      "Koperasi Syariah",
      "CC-1003",
      "Manager Koperasi",
      true,
      timestamp,
      timestamp,
    ],
  ];

  sheet
    .getRange(
      2,
      1,
      rows.length,
      rows[0].length,
    )
    .setValues(rows);
}

function seedUsers() {
  const sheet = getDatabaseSheet(
    APP_CONFIG.sheets.users,
  );

  if (sheet.getLastRow() > 1) {
    console.log(
      "users sudah memiliki data. Seed dilewati.",
    );
    return;
  }

  const timestamp = new Date().toISOString();

  const rows = [
    [
      "usr-01",
      "Andini Ayu Lestari",
      "andini@example.com",
      "bu-01",
      "UNIT_USER",
      "Staf Administrasi Unit",
      true,
      timestamp,
      timestamp,
    ],
    [
      "usr-03",
      "Fitriani Maharani",
      "fitriani@example.com",
      "",
      "FINANCE_REVIEWER",
      "Finance Reviewer",
      true,
      timestamp,
      timestamp,
    ],
    [
      "usr-04",
      "Hendra Wijaya",
      "hendra@example.com",
      "",
      "FINANCE_PAYMENT",
      "Finance Payment",
      true,
      timestamp,
      timestamp,
    ],
    [
      "usr-05",
      "Wira Ananda",
      "wira@example.com",
      "",
      "ADMIN",
      "Administrator",
      true,
      timestamp,
      timestamp,
    ],
  ];

  sheet
    .getRange(
      2,
      1,
      rows.length,
      rows[0].length,
    )
    .setValues(rows);
}