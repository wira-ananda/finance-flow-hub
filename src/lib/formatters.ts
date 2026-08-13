/** Rupiah tanpa desimal, contoh: Rp5.000.000 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace(/\s/g, "")
    .replace("Rp", "Rp");
}

/** Ringkas: Rp5,0 jt / Rp1,2 mly */
export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} mly`;
  if (amount >= 1_000_000) return `Rp${(amount / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  if (amount >= 1_000) return `Rp${(amount / 1_000).toFixed(0)} rb`;
  return formatRupiah(amount);
}

const DATE_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTanggal(iso: string): string {
  return DATE_FMT.format(new Date(iso));
}

export function formatTanggalWaktu(iso: string): string {
  return DATETIME_FMT.format(new Date(iso)).replace(".", ":");
}

export function formatRelatif(iso: string, now = new Date("2026-08-13T15:54:00Z")): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const menit = Math.round(diffMs / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  return formatTanggal(iso);
}

export function formatUkuranFile(sizeKb: number): string {
  if (sizeKb >= 1024) return `${(sizeKb / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${sizeKb} KB`;
}
