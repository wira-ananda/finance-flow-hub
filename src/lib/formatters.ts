/** Rupiah tanpa desimal, contoh: Rp5.000.000 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, "");
}

/** Nominal ringkas untuk dashboard. */
export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }

  if (amount >= 1_000_000) {
    return `Rp${(amount / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  }

  if (amount >= 1_000) {
    return `Rp${Math.round(amount / 1_000)} rb`;
  }

  return formatRupiah(amount);
}

const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function parseDate(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatTanggal(iso: string): string {
  const date = parseDate(iso);

  if (!date) {
    return "-";
  }

  return DATE_FORMATTER.format(date);
}

export function formatTanggalWaktu(iso: string): string {
  const date = parseDate(iso);

  if (!date) {
    return "-";
  }

  return DATETIME_FORMATTER.format(date).replace(/\./g, ":");
}

export function formatRelatif(iso: string, now = new Date()): string {
  const date = parseDate(iso);

  if (!date) {
    return "-";
  }

  const differenceMs = now.getTime() - date.getTime();

  if (differenceMs < 0) {
    return formatTanggal(iso);
  }

  const minutes = Math.floor(differenceMs / 60_000);

  if (minutes < 1) {
    return "baru saja";
  }

  if (minutes < 60) {
    return `${minutes} menit lalu`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} jam lalu`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days} hari lalu`;
  }

  return formatTanggal(iso);
}

export function formatUkuranFile(sizeKb: number): string {
  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1).replace(".", ",")} MB`;
  }

  return `${sizeKb} KB`;
}
