export function cleanJD(raw: string): string {
  const s = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  return s.split("\n").map(l => l.trim()).join("\n").trim();
}