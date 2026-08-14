function insertHistoryRecord(
  history: RequestHistoryRecord,
): RequestHistoryRecord {
  appendRecord(
    APP_CONFIG.sheets.requestHistories,
    history as unknown as SheetRecord,
  );

  return history;
}

function listRequestHistoryRecords(requestId: string): RequestHistoryRecord[] {
  return getRowsByField(
    APP_CONFIG.sheets.requestHistories,
    "request_id",
    requestId,
  ).map((record) => ({
    id: String(record.id ?? ""),

    request_id: String(record.request_id ?? ""),

    actor_id: String(record.actor_id ?? ""),

    action: String(record.action ?? ""),

    previous_status: String(record.previous_status ?? ""),

    new_status: String(record.new_status ?? ""),

    notes: String(record.notes ?? ""),

    created_at: String(record.created_at ?? ""),
  }));
}

function recordRequestHistory(
  requestId: string,
  actorId: string,
  action: string,
  previousStatus: string,
  newStatus: string,
  notes = "",
): RequestHistoryRecord {
  const history: RequestHistoryRecord = {
    id: createEntityId("hist"),

    request_id: requestId,

    actor_id: actorId,

    action,

    previous_status: previousStatus,

    new_status: newStatus,

    notes,

    created_at: nowIso(),
  };

  return insertHistoryRecord(history);
}
