interface ApprovalTemplateData {
  DOCUMENT_NUMBER: string;
  REQUEST_NUMBER: string;
  APPROVAL_DATE: string;

  BUSINESS_UNIT: string;

  REQUESTER_NAME: string;
  REQUESTER_JOB_TITLE: string;

  TITLE: string;
  CATEGORY: string;
  DESCRIPTION: string;
  AMOUNT: string;
  NEEDED_DATE: string;

  BENEFICIARY_NAME: string;
  BENEFICIARY_BANK: string;
  BENEFICIARY_ACCOUNT: string;

  APPROVER_NAME: string;
  APPROVER_JOB_TITLE: string;
}

function generateApprovalDocumentService(
  request: FinancialRequestRecord,
  approver: UserRecord,
  approvedAt: string,
): RequestDocumentRecord {
  const existingDocument = findApprovalDocumentByRequestId(request.id);

  if (existingDocument) {
    return existingDocument;
  }

  const documentNumber = getNextApprovalDocumentNumber();

  const templateData = buildApprovalTemplateData(
    request,
    approver,
    documentNumber,
    approvedAt,
  );

  const destinationFolder = getOrCreateRequestDriveFolder(
    getApprovalLettersRootFolder(),
    request.request_number,
  );

  const templateFile = getApprovalTemplateFile();

  const temporaryFileName = `TEMP_${request.request_number}_${Date.now()}`;

  let temporaryDocumentFile: GoogleAppsScript.Drive.File | null = null;

  let pdfFile: GoogleAppsScript.Drive.File | null = null;

  try {
    temporaryDocumentFile = templateFile.makeCopy(
      temporaryFileName,
      destinationFolder,
    );

    const document = DocumentApp.openById(temporaryDocumentFile.getId());

    replaceApprovalTemplatePlaceholders(document, templateData);

    assertNoApprovalPlaceholderRemains(document);

    document.saveAndClose();

    const pdfFileName = `Surat_Persetujuan_${request.request_number}.pdf`;

    const pdfBlob = DocumentApp.openById(temporaryDocumentFile.getId())
      .getAs(MimeType.PDF)
      .setName(pdfFileName);

    pdfFile = destinationFolder.createFile(pdfBlob);

    const record: RequestDocumentRecord = {
      id: createEntityId("doc"),

      request_id: request.id,

      document_type: "SURAT_PERSETUJUAN",

      document_number: documentNumber,

      file_name: pdfFile.getName(),

      file_id: pdfFile.getId(),

      file_url: pdfFile.getUrl(),

      size_kb: Math.ceil(pdfFile.getSize() / 1024),

      generated_at: approvedAt,

      generated_by: approver.id,
    };

    insertRequestDocumentRecord(record);

    temporaryDocumentFile.setTrashed(true);

    return record;
  } catch (error) {
    if (pdfFile) {
      safeTrashDriveFile(pdfFile.getId());
    }

    if (temporaryDocumentFile) {
      safeTrashDriveFile(temporaryDocumentFile.getId());
    }

    throw error;
  }
}

function buildApprovalTemplateData(
  request: FinancialRequestRecord,
  approver: UserRecord,
  documentNumber: string,
  approvedAt: string,
): ApprovalTemplateData {
  const requester = getActorById(request.requested_by);

  const businessUnitRecord = findBusinessUnitRecordById(
    request.business_unit_id,
  );

  if (!businessUnitRecord) {
    throw createDomainError(
      "Unit Bisnis pengajuan tidak ditemukan.",
      "BUSINESS_UNIT_NOT_FOUND",
    );
  }

  return {
    DOCUMENT_NUMBER: documentNumber,

    REQUEST_NUMBER: request.request_number,

    APPROVAL_DATE: formatDocumentDateTime(approvedAt),

    BUSINESS_UNIT: String(businessUnitRecord.name ?? ""),

    REQUESTER_NAME: requester.name,

    REQUESTER_JOB_TITLE: requester.job_title || "-",

    TITLE: request.title,

    CATEGORY: formatRequestCategory(request.category),

    DESCRIPTION: request.description,

    AMOUNT: formatRupiah(request.amount),

    NEEDED_DATE: formatDocumentDate(request.needed_at),

    BENEFICIARY_NAME: request.beneficiary_name,

    BENEFICIARY_BANK: request.beneficiary_bank,

    BENEFICIARY_ACCOUNT: request.beneficiary_account,

    APPROVER_NAME: approver.name,

    APPROVER_JOB_TITLE: approver.job_title || "Finance Reviewer",
  };
}

function replaceApprovalTemplatePlaceholders(
  document: GoogleAppsScript.Document.Document,
  data: ApprovalTemplateData,
): void {
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;

    const pattern = escapeDocumentSearchPattern(placeholder);

    const replacement = String(value ?? "");

    document.getBody().replaceText(pattern, replacement);

    const header = document.getHeader();

    if (header) {
      header.replaceText(pattern, replacement);
    }

    const footer = document.getFooter();

    if (footer) {
      footer.replaceText(pattern, replacement);
    }
  });
}

function assertNoApprovalPlaceholderRemains(
  document: GoogleAppsScript.Document.Document,
): void {
  const content = [
    document.getBody().getText(),

    document.getHeader()?.getText() ?? "",

    document.getFooter()?.getText() ?? "",
  ].join("\n");

  const unresolved = content.match(/\{\{[A-Z0-9_]+\}\}/g);

  if (unresolved && unresolved.length > 0) {
    throw createDomainError(
      `Placeholder template belum terisi: ${[...new Set(unresolved)].join(
        ", ",
      )}`,
      "UNRESOLVED_DOCUMENT_PLACEHOLDER",
    );
  }
}

function escapeDocumentSearchPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRupiah(amount: number): string {
  const rounded = Math.round(Number(amount));

  const formatted = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `Rp ${formatted}`;
}

function formatDocumentDate(value: string): string {
  if (!value) {
    return "-";
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return value;
  }

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const year = Number(match[1]);

  const month = Number(match[2]);

  const day = Number(match[3]);

  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatDocumentDateTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const timeZone = Session.getScriptTimeZone();

  const formatted = Utilities.formatDate(date, timeZone, "yyyy-MM-dd HH:mm");

  const [datePart, timePart] = formatted.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":");

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return `${day} ${monthNames[month - 1]} ${year}`;
}

function formatRequestCategory(category: RequestCategory): string {
  const labels: Record<RequestCategory, string> = {
    OPERASIONAL: "Operasional",

    PENGADAAN: "Pengadaan",

    PERJALANAN_DINAS: "Perjalanan Dinas",

    REIMBURSEMENT: "Reimbursement",

    PEMASARAN: "Pemasaran",
  };

  return labels[category] ?? String(category).replace(/_/g, " ").toLowerCase();
}

function rollbackApprovalDocument(document: RequestDocumentRecord): void {
  try {
    deleteRequestDocumentRecord(document.id);
  } catch (error) {
    console.error("Rollback record approval document gagal.", error);
  }

  safeTrashDriveFile(document.file_id);
}
