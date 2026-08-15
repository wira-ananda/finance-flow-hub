function test6BFullWorkflow() {
  console.log("=== STEP 6B TEST START ===");

  const unitUserId = "usr-01";

  const reviewerId = "usr-03";

  const paymentUserId = "usr-04";

  const draft = createRequestService(unitUserId, {
    title: "Pengujian Workflow Step 6B",

    description:
      "Pengajuan development untuk menguji alur backend Google Apps Script.",

    category: "OPERASIONAL",

    amount: 1500000,

    beneficiaryName: "PT Vendor Development",

    beneficiaryBank: "Bank Mandiri",

    beneficiaryAccount: "1234567890",

    neededAt: "2026-08-20",

    submitNow: false,
  });

  console.log(`DRAFT: ${draft.request_number}`);

  const submitted = submitRequestService(unitUserId, draft.id);

  console.log(`SUBMITTED: ${submitted.status}`);

  const reviewed = startReviewService(reviewerId, draft.id);

  console.log(`UNDER_REVIEW: ${reviewed.status}`);

  const approved = approveRequestService(reviewerId, draft.id);

  console.log(`APPROVED: ${approved.status}`);

  const paid = processPaymentService(paymentUserId, draft.id, {
    amount: 1500000,

    paymentDate: "2026-08-14",

    referenceNumber: `DEV-${Date.now()}`,

    proofFile: createDevelopmentPdfUpload("bukti-transfer-development.pdf"),
  });

  console.log(`PAID: ${paid.status}`);

  const detail = getRequestDetailForActor(unitUserId, draft.id);

  console.log(JSON.stringify(detail, null, 2));

  console.log("=== STEP 6B TEST COMPLETE ===");
}

function test6BRevisionWorkflow() {
  console.log("=== REVISION TEST START ===");

  const unitUserId = "usr-01";

  const reviewerId = "usr-03";

  const draft = createRequestService(unitUserId, {
    title: "Pengujian Revisi Step 6B",

    description: "Testing alur revision required dan resubmit.",

    category: "PENGADAAN",

    amount: 2000000,

    beneficiaryName: "Vendor Test",

    beneficiaryBank: "BCA",

    beneficiaryAccount: "9988776655",

    neededAt: "2026-08-25",

    submitNow: true,
  });

  console.log(`SUBMITTED: ${draft.status}`);

  startReviewService(reviewerId, draft.id);

  const revision = requestRevisionService(
    reviewerId,
    draft.id,
    "Mohon perbaiki detail justifikasi.",
  );

  console.log(`REVISION_REQUIRED: ${revision.status}`);

  updateRequestService(unitUserId, draft.id, {
    description:
      "Justifikasi sudah diperbaiki sesuai catatan Finance Reviewer.",
  });

  const resubmitted = submitRequestService(unitUserId, draft.id);

  console.log(`RESUBMITTED: ${resubmitted.status}`);

  console.log("=== REVISION TEST COMPLETE ===");
}

function test6BRejectWorkflow(): void {
  console.log("=== REJECT TEST START ===");

  const unitUserId = "usr-01";
  const reviewerId = "usr-03";

  const request = createRequestService(unitUserId, {
    title: "Pengujian Reject Step 6B",
    description: "Testing workflow reject oleh Finance Reviewer.",
    category: "OPERASIONAL",
    amount: 750000,
    beneficiaryName: "Vendor Reject Test",
    beneficiaryBank: "BCA",
    beneficiaryAccount: "123456789",
    neededAt: "2026-08-25",
    submitNow: true,
  });

  console.log(`SUBMITTED: ${request.status}`);

  const underReview = startReviewService(reviewerId, request.id);

  console.log(`UNDER_REVIEW: ${underReview.status}`);

  const rejected = rejectRequestService(
    reviewerId,
    request.id,
    "Dokumen dan justifikasi pengajuan tidak memenuhi ketentuan.",
  );

  console.log(`REJECTED: ${rejected.status}`);

  if (rejected.status !== "REJECTED") {
    throw new Error(`Expected REJECTED, received ${rejected.status}`);
  }

  console.log("=== REJECT TEST COMPLETE ===");
}

function test6BRolePermission(): void {
  console.log("=== PERMISSION TEST START ===");

  const unitUserId = "usr-01";

  const request = createRequestService(unitUserId, {
    title: "Permission Test",
    description: "Testing backend role authorization.",
    category: "OPERASIONAL",
    amount: 500000,
    beneficiaryName: "Permission Vendor",
    beneficiaryBank: "BNI",
    beneficiaryAccount: "123456789",
    neededAt: "2026-08-26",
    submitNow: true,
  });

  try {
    startReviewService(unitUserId, request.id);

    throw new Error(
      "SECURITY TEST FAILED: UNIT_USER berhasil melakukan review.",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("SECURITY TEST FAILED")) {
      throw error;
    }

    console.log(`EXPECTED ERROR: ${message}`);
  }

  console.log("=== PERMISSION TEST COMPLETE ===");
}

function test6BInvalidTransition(): void {
  console.log("=== INVALID TRANSITION TEST START ===");

  const unitUserId = "usr-01";
  const reviewerId = "usr-03";

  const request = createRequestService(unitUserId, {
    title: "Invalid Transition Test",
    description: "Testing final status protection.",
    category: "OPERASIONAL",
    amount: 600000,
    beneficiaryName: "Transition Vendor",
    beneficiaryBank: "BRI",
    beneficiaryAccount: "987654321",
    neededAt: "2026-08-27",
    submitNow: true,
  });

  startReviewService(reviewerId, request.id);

  rejectRequestService(
    reviewerId,
    request.id,
    "Ditolak untuk pengujian transition.",
  );

  try {
    approveRequestService(reviewerId, request.id);

    throw new Error(
      "TRANSITION TEST FAILED: REJECTED berhasil berubah menjadi APPROVED.",
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("TRANSITION TEST FAILED")) {
      throw error;
    }

    console.log(`EXPECTED ERROR: ${message}`);
  }

  console.log("=== INVALID TRANSITION TEST COMPLETE ===");
}

function createDevelopmentPdfUpload(fileName: string): UploadFileInput {
  const content = [
    "%PDF-1.4",
    "1 0 obj",
    "<< /Type /Catalog >>",
    "endobj",
    "trailer",
    "<<>>",
    "%%EOF",
  ].join("\n");

  const bytes = Utilities.newBlob(content).getBytes();

  return {
    name: fileName,
    mimeType: "application/pdf",
    base64: Utilities.base64Encode(bytes),
  };
}

function test6CAttachmentWorkflow(): void {
  console.log("=== ATTACHMENT TEST START ===");

  const unitUserId = "usr-01";

  const request = createRequestService(unitUserId, {
    title: "Attachment Drive Test",

    description: "Pengujian integrasi attachment ke Google Drive.",

    category: "OPERASIONAL",

    amount: 500000,

    beneficiaryName: "Vendor Attachment",

    beneficiaryBank: "BCA",

    beneficiaryAccount: "123456789",

    neededAt: "2026-08-30",

    submitNow: false,
  });

  const attachment = uploadRequestAttachmentService(
    unitUserId,
    request.id,
    createDevelopmentPdfUpload("invoice-test.pdf"),
  );

  console.log(`UPLOADED: ${attachment.file_name}`);

  console.log(`FILE ID: ${attachment.file_id}`);

  const driveFile = DriveApp.getFileById(attachment.file_id);

  if (driveFile.isTrashed()) {
    throw new Error("Attachment seharusnya tidak berada di trash.");
  }

  deleteRequestAttachmentService(unitUserId, attachment.id);

  const deletedRecord = findAttachmentRecordById(attachment.id);

  if (deletedRecord) {
    throw new Error("Attachment record masih ada setelah delete.");
  }

  console.log("ATTACHMENT DELETE: OK");

  console.log("=== ATTACHMENT TEST COMPLETE ===");
}

function test6CPaymentProofWorkflow(): void {
  console.log("=== PAYMENT PROOF TEST START ===");

  const unitUserId = "usr-01";

  const reviewerId = "usr-03";

  const paymentUserId = "usr-04";

  const request = createRequestService(unitUserId, {
    title: "Payment Proof Drive Test",

    description: "Pengujian bukti pembayaran Google Drive.",

    category: "OPERASIONAL",

    amount: 1250000,

    beneficiaryName: "Vendor Payment Test",

    beneficiaryBank: "Mandiri",

    beneficiaryAccount: "1234567890",

    neededAt: "2026-08-30",

    submitNow: true,
  });

  startReviewService(reviewerId, request.id);

  approveRequestService(reviewerId, request.id);

  const paid = processPaymentService(paymentUserId, request.id, {
    amount: 1200000,

    paymentDate: "2026-08-15",

    referenceNumber: `PAY-${Date.now()}`,

    proofFile: createDevelopmentPdfUpload("payment-proof-test.pdf"),
  });

  if (paid.status !== "PAID") {
    throw new Error(`Expected PAID, received ${paid.status}`);
  }

  const payment = findPaymentByRequestId(request.id);

  if (!payment) {
    throw new Error("Payment record tidak ditemukan.");
  }

  if (!payment.proof_file_id) {
    throw new Error("Drive proof file ID tidak ditemukan.");
  }

  const proofFile = DriveApp.getFileById(payment.proof_file_id);

  console.log(`PROOF: ${proofFile.getName()}`);

  console.log(`STATUS: ${paid.status}`);

  console.log("=== PAYMENT PROOF TEST COMPLETE ===");
}
