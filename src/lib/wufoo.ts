/**
 * Wufoo webhook payloads are usually application/x-www-form-urlencoded.
 * Field keys are Field1, Field2, ... or Title1, Title2 for labels in some exports.
 */

export type FlatFields = Record<string, string>;

export function flattenWufooBody(body: Record<string, unknown>): FlatFields {
  const out: FlatFields = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
  }
  return out;
}

/** Env: WUFOO_REQUIRED_FIELDS — comma-separated Field keys that must be non-empty for COMPLETE */
export function assessCompleteness(
  fields: FlatFields,
  requiredKeys: string[] | null
): { completeness: "INCOMPLETE" | "COMPLETE"; missing: string[] } {
  const keys =
    requiredKeys && requiredKeys.length > 0
      ? requiredKeys
      : inferDefaultRequiredKeys(fields);

  const missing: string[] = [];
  for (const key of keys) {
    const v = fields[key]?.trim();
    if (!v) missing.push(key);
  }

  return {
    completeness: missing.length === 0 ? "COMPLETE" : "INCOMPLETE",
    missing,
  };
}

function inferDefaultRequiredKeys(fields: FlatFields): string[] {
  const keys = Object.keys(fields)
    .filter((k) => /^Field\d+$/i.test(k))
    .sort((a, b) => {
      const na = parseInt(String(a).replace(/\D/g, ""), 10);
      const nb = parseInt(String(b).replace(/\D/g, ""), 10);
      return (Number.isNaN(na) ? 0 : na) - (Number.isNaN(nb) ? 0 : nb);
    });
  if (keys.length === 0) return ["Field1"];
  // İlk 3 Wufoo alanı (formu doldurma) — env ile WUFOO_REQUIRED_FIELDS ile ezersin
  return keys.slice(0, 3);
}

export function extractContactHints(fields: FlatFields): {
  name?: string;
  email?: string;
  phone?: string;
} {
  const lower = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => {
      const s = typeof v === "string" ? v : v != null ? String(v) : "";
      return [k.toLowerCase(), s] as const;
    })
  ) as Record<string, string>;

  let name: string | undefined;
  let email: string | undefined;
  let phone: string | undefined;

  for (const [k, v] of Object.entries(lower)) {
    if (!v.trim()) continue;
    if (k.includes("name") || k === "field1") name = v.trim();
    if (k.includes("mail") || v.includes("@")) email = v.trim();
    if (k.includes("phone") || k.includes("tel") || /^\+?\d[\d\s-]{6,}$/.test(v))
      phone = v.trim();
  }

  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  for (const v of Object.values(fields)) {
    const s = typeof v === "string" ? v : v != null ? String(v) : "";
    const m = s.match(emailRegex);
    if (m) email = m[0];
  }

  return { name, email, phone };
}

export function fieldsToNarrative(fields: FlatFields): string {
  return Object.entries(fields)
    .map(([k, v]) => {
      const s = typeof v === "string" ? v : v != null ? String(v) : "";
      return [k, s] as const;
    })
    .filter(([, s]) => s.trim().length > 0)
    .map(([k, s]) => `${k}: ${s}`)
    .join("\n");
}
