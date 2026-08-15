const DRIVE_PROPERTY_KEYS = Object.freeze({
  root: "FINANCE_ROOT_FOLDER_ID",
  attachments: "ATTACHMENTS_FOLDER_ID",
  paymentProofs: "PAYMENT_PROOFS_FOLDER_ID",
});

interface DriveConfigResult {
  rootFolderId: string;
  rootFolderName: string;
  attachmentsFolderId: string;
  paymentProofsFolderId: string;
}

function setupDriveConfig(): DriveConfigResult {
  const rootFolderId = getRequiredScriptProperty(DRIVE_PROPERTY_KEYS.root);

  const rootFolder = DriveApp.getFolderById(rootFolderId);

  const attachmentsFolder = getUniqueChildFolder(rootFolder, "Attachments");

  const paymentProofsFolder = getUniqueChildFolder(
    rootFolder,
    "Payment Proofs",
  );

  PropertiesService.getScriptProperties().setProperties({
    [DRIVE_PROPERTY_KEYS.attachments]: attachmentsFolder.getId(),

    [DRIVE_PROPERTY_KEYS.paymentProofs]: paymentProofsFolder.getId(),
  });

  const result: DriveConfigResult = {
    rootFolderId: rootFolder.getId(),

    rootFolderName: rootFolder.getName(),

    attachmentsFolderId: attachmentsFolder.getId(),

    paymentProofsFolderId: paymentProofsFolder.getId(),
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function validateDriveConfig(): DriveConfigResult {
  const rootFolder = DriveApp.getFolderById(
    getRequiredScriptProperty(DRIVE_PROPERTY_KEYS.root),
  );

  const attachmentsFolder = getAttachmentsRootFolder();

  const paymentProofsFolder = getPaymentProofsRootFolder();

  const result: DriveConfigResult = {
    rootFolderId: rootFolder.getId(),

    rootFolderName: rootFolder.getName(),

    attachmentsFolderId: attachmentsFolder.getId(),

    paymentProofsFolderId: paymentProofsFolder.getId(),
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function getAttachmentsRootFolder(): GoogleAppsScript.Drive.Folder {
  return DriveApp.getFolderById(
    getRequiredScriptProperty(DRIVE_PROPERTY_KEYS.attachments),
  );
}

function getPaymentProofsRootFolder(): GoogleAppsScript.Drive.Folder {
  return DriveApp.getFolderById(
    getRequiredScriptProperty(DRIVE_PROPERTY_KEYS.paymentProofs),
  );
}

function getUniqueChildFolder(
  parentFolder: GoogleAppsScript.Drive.Folder,
  folderName: string,
): GoogleAppsScript.Drive.Folder {
  const folders = parentFolder.getFoldersByName(folderName);

  if (!folders.hasNext()) {
    throw createDomainError(
      `Folder "${folderName}" tidak ditemukan di "${parentFolder.getName()}".`,
      "DRIVE_FOLDER_NOT_FOUND",
    );
  }

  const folder = folders.next();

  if (folders.hasNext()) {
    throw createDomainError(
      `Terdapat lebih dari satu folder "${folderName}". Nama folder harus unik.`,
      "DUPLICATE_DRIVE_FOLDER",
    );
  }

  return folder;
}
