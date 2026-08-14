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

    proofFileId: "development-proof-file-id",

    proofFileUrl: "https://example.com/development-proof",
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
