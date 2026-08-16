function test7H5AdminManagement(): void {
  console.log("=== STEP 7H.5 ADMIN MANAGEMENT TEST START ===");

  const admin = listActiveUserRecords().find((user) => user.role === "ADMIN");

  if (!admin) {
    throw new Error(
      "Tidak ada Administrator aktif untuk menjalankan test 7H.5.",
    );
  }

  const unitUser = listActiveUserRecords().find(
    (user) => user.role === "UNIT_USER",
  );

  const suffix = String(Date.now());

  let createdUnitId = "";

  let createdUserId = "";

  try {
    const createdUnit = createBusinessUnitService(admin.id, {
      code: `DEV-${suffix.slice(-6)}`,

      name: `Development Unit ${suffix}`,

      costCenter: `DEV-CC-${suffix.slice(-6)}`,

      managerName: "Development Manager",
    });

    createdUnitId = createdUnit.id;

    console.log(`BUSINESS UNIT CREATED: ${createdUnit.id}`);

    const updatedUnit = updateBusinessUnitService(admin.id, createdUnit.id, {
      code: createdUnit.code,

      name: `${createdUnit.name} Updated`,

      costCenter: createdUnit.cost_center,

      managerName: "Updated Development Manager",
    });

    if (updatedUnit.manager_name !== "Updated Development Manager") {
      throw new Error("Business Unit update tidak tersimpan.");
    }

    console.log("BUSINESS UNIT UPDATE: OK");

    const createdUser = createUserService(admin.id, {
      name: "Development Unit User",

      email: `finance-dev-${suffix}@example.com`,

      role: "UNIT_USER",

      jobTitle: "Development Tester",

      businessUnitId: createdUnit.id,
    });

    createdUserId = createdUser.id;

    console.log(`USER CREATED: ${createdUser.id}`);

    const updatedUser = updateUserService(admin.id, createdUser.id, {
      name: "Development Unit User Updated",

      email: createdUser.email,

      role: "UNIT_USER",

      jobTitle: "Development Tester Updated",

      businessUnitId: createdUnit.id,
    });

    if (updatedUser.job_title !== "Development Tester Updated") {
      throw new Error("User update tidak tersimpan.");
    }

    console.log("USER UPDATE: OK");

    try {
      setBusinessUnitActiveService(admin.id, createdUnit.id, false);

      throw new Error(
        "BUSINESS UNIT GUARD FAILED: Unit dengan user aktif berhasil dinonaktifkan.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("BUSINESS UNIT GUARD FAILED")) {
        throw error;
      }

      console.log(`EXPECTED UNIT GUARD: ${message}`);
    }

    setUserActiveService(admin.id, createdUser.id, false);

    console.log("USER DEACTIVATE: OK");

    const inactiveUnit = setBusinessUnitActiveService(
      admin.id,
      createdUnit.id,
      false,
    );

    if (inactiveUnit.is_active) {
      throw new Error("Business Unit seharusnya nonaktif.");
    }

    console.log("BUSINESS UNIT DEACTIVATE: OK");

    setBusinessUnitActiveService(admin.id, createdUnit.id, true);

    setUserActiveService(admin.id, createdUser.id, true);

    console.log("REACTIVATE: OK");

    try {
      setUserActiveService(admin.id, admin.id, false);

      throw new Error(
        "SELF DEACTIVATE GUARD FAILED: Admin berhasil menonaktifkan dirinya sendiri.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("SELF DEACTIVATE GUARD FAILED")) {
        throw error;
      }

      console.log(`EXPECTED SELF GUARD: ${message}`);
    }

    if (unitUser) {
      try {
        createBusinessUnitService(unitUser.id, {
          code: `DENY-${suffix.slice(-5)}`,

          name: `Denied Unit ${suffix}`,

          costCenter: "DENIED",

          managerName: "Denied",
        });

        throw new Error(
          "PERMISSION GUARD FAILED: UNIT_USER berhasil membuat Unit Bisnis.",
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes("PERMISSION GUARD FAILED")) {
          throw error;
        }

        console.log(`EXPECTED PERMISSION ERROR: ${message}`);
      }
    }

    console.log("=== STEP 7H.5 ADMIN MANAGEMENT TEST COMPLETE ===");
  } finally {
    if (createdUserId) {
      deleteRecordById(APP_CONFIG.sheets.users, createdUserId);
    }

    if (createdUnitId) {
      deleteRecordById(APP_CONFIG.sheets.businessUnits, createdUnitId);
    }

    console.log("STEP 7H.5 TEST CLEANUP: COMPLETE");
  }
}
