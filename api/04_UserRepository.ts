  function listUserRecords() {
  return getAllRows(
    APP_CONFIG.sheets.users,
  );
}

function findUserRecordById(userId) {
  return findRowById(
    APP_CONFIG.sheets.users,
    userId,
  );
}

function findUserRecordByEmail(email) {
  if (!email) {
    return null;
  }

  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  return (
    listUserRecords().find(
      function (user) {
        return (
          String(user.email)
            .trim()
            .toLowerCase() ===
          normalizedEmail
        );
      },
    ) || null
  );
}

function listActiveUserRecords() {
  return listUserRecords().filter(
    function (user) {
      return normalizeBoolean(
        user.is_active,
      );
    },
  );
}

function normalizeBoolean(value) {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes"
  );
}