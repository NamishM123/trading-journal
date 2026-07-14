export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtR(n: number | null | undefined): string {
  if (n == null) return "-";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}R`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "-";
  return `${Math.round(n * 100)}%`;
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d + "T12:00:00") : d;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtDateShort(d: string): string {
  const date = new Date(d + "T12:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function todayISO(): string {
  const now = new Date();
  const off = now.getTimezoneOffset();
  return new Date(now.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,20})/
  );
  return m ? m[1] : null;
}
