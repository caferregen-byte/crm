/**
 * RSC / istemci güvenliği: undefined veya string olmayan değerlerde .replace patlamasını önler.
 */
export function humanizeUnderscores(value: unknown): string {
  if (value == null) return "";
  if (typeof value !== "string") return String(value).replace(/_/g, " ");
  return value.replace(/_/g, " ");
}
