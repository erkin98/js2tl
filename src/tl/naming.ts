export function toConstructorName(typeName: string): string {
  if (!typeName) return "root";
  const s = typeName.trim();
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function safeTlIdent(input: string): string {
  const s = input.trim().replace(/[^\w]/g, "_");
  const out = s.length === 0 ? "field" : s;
  return /^\d/.test(out) ? `_${out}` : out;
}
