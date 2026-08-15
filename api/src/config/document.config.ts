const DOCUMENT_PROPERTY_KEYS = Object.freeze({
  templatesFolder: "TEMPLATES_FOLDER_ID",

  approvalLettersFolder: "APPROVAL_LETTERS_FOLDER_ID",

  approvalTemplate: "APPROVAL_TEMPLATE_FILE_ID",
});

const APPROVAL_TEMPLATE_NAME = "Approval Letter Template";

interface ApprovalDocumentConfigResult {
  templatesFolderId: string;
  approvalLettersFolderId: string;
  approvalTemplateFileId: string;
  approvalTemplateName: string;
}

function setupApprovalDocumentConfig(): ApprovalDocumentConfigResult {
  const rootFolder = DriveApp.getFolderById(
    getRequiredScriptProperty(DRIVE_PROPERTY_KEYS.root),
  );

  const templatesFolder = getUniqueChildFolder(rootFolder, "Templates");

  const approvalLettersFolder = getUniqueChildFolder(
    rootFolder,
    "Approval Letters",
  );

  const templateFile = getUniqueFileByName(
    templatesFolder,
    APPROVAL_TEMPLATE_NAME,
  );

  if (templateFile.getMimeType() !== MimeType.GOOGLE_DOCS) {
    throw createDomainError(
      `"${APPROVAL_TEMPLATE_NAME}" harus berupa Google Docs.`,
      "INVALID_APPROVAL_TEMPLATE",
    );
  }

  PropertiesService.getScriptProperties().setProperties({
    [DOCUMENT_PROPERTY_KEYS.templatesFolder]: templatesFolder.getId(),

    [DOCUMENT_PROPERTY_KEYS.approvalLettersFolder]:
      approvalLettersFolder.getId(),

    [DOCUMENT_PROPERTY_KEYS.approvalTemplate]: templateFile.getId(),
  });

  const result: ApprovalDocumentConfigResult = {
    templatesFolderId: templatesFolder.getId(),

    approvalLettersFolderId: approvalLettersFolder.getId(),

    approvalTemplateFileId: templateFile.getId(),

    approvalTemplateName: templateFile.getName(),
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function validateApprovalDocumentConfig(): ApprovalDocumentConfigResult {
  const templatesFolder = DriveApp.getFolderById(
    getRequiredScriptProperty(DOCUMENT_PROPERTY_KEYS.templatesFolder),
  );

  const approvalLettersFolder = DriveApp.getFolderById(
    getRequiredScriptProperty(DOCUMENT_PROPERTY_KEYS.approvalLettersFolder),
  );

  const templateFile = DriveApp.getFileById(
    getRequiredScriptProperty(DOCUMENT_PROPERTY_KEYS.approvalTemplate),
  );

  if (templateFile.getMimeType() !== MimeType.GOOGLE_DOCS) {
    throw createDomainError(
      "Approval template bukan Google Docs.",
      "INVALID_APPROVAL_TEMPLATE",
    );
  }

  const result: ApprovalDocumentConfigResult = {
    templatesFolderId: templatesFolder.getId(),

    approvalLettersFolderId: approvalLettersFolder.getId(),

    approvalTemplateFileId: templateFile.getId(),

    approvalTemplateName: templateFile.getName(),
  };

  console.log(JSON.stringify(result, null, 2));

  return result;
}

function getApprovalLettersRootFolder(): GoogleAppsScript.Drive.Folder {
  return DriveApp.getFolderById(
    getRequiredScriptProperty(DOCUMENT_PROPERTY_KEYS.approvalLettersFolder),
  );
}

function getApprovalTemplateFile(): GoogleAppsScript.Drive.File {
  return DriveApp.getFileById(
    getRequiredScriptProperty(DOCUMENT_PROPERTY_KEYS.approvalTemplate),
  );
}

function getUniqueFileByName(
  parentFolder: GoogleAppsScript.Drive.Folder,
  fileName: string,
): GoogleAppsScript.Drive.File {
  const files = parentFolder.getFilesByName(fileName);

  if (!files.hasNext()) {
    throw createDomainError(
      `File "${fileName}" tidak ditemukan di folder "${parentFolder.getName()}".`,
      "DOCUMENT_TEMPLATE_NOT_FOUND",
    );
  }

  const file = files.next();

  if (files.hasNext()) {
    throw createDomainError(
      `Terdapat lebih dari satu file "${fileName}".`,
      "DUPLICATE_DOCUMENT_TEMPLATE",
    );
  }

  return file;
}
