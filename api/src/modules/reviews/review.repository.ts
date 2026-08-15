function insertReviewRecord(review: RequestReviewRecord): RequestReviewRecord {
  appendRecord(
    APP_CONFIG.sheets.requestReviews,
    review as unknown as SheetRecord,
  );

  return review;
}

function listReviewRecords(requestId: string): RequestReviewRecord[] {
  return getRowsByField(
    APP_CONFIG.sheets.requestReviews,
    "request_id",
    requestId,
  ).map((record) => ({
    id: String(record.id ?? ""),

    request_id: String(record.request_id ?? ""),

    reviewer_id: String(record.reviewer_id ?? ""),

    action: String(record.action ?? ""),

    notes: String(record.notes ?? ""),

    created_at: String(record.created_at ?? ""),
  }));
}

function recordReviewAction(
  requestId: string,
  reviewerId: string,
  action: string,
  notes = "",
): RequestReviewRecord {
  return insertReviewRecord({
    id: createEntityId("review"),

    request_id: requestId,

    reviewer_id: reviewerId,

    action,

    notes,

    created_at: nowIso(),
  });
}

function deleteReviewRecord(reviewId: string): boolean {
  return deleteRecordById(APP_CONFIG.sheets.requestReviews, reviewId);
}
