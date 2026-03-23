/** Gün listesi: ulaşılamadı sonrası ilk hatırlatma (varsayılan 1 gün) */
export function parseFollowUpDays(): number[] {
  const raw = (process.env.FOLLOW_UP_DAYS?.trim() || "1,3,7,30");
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
