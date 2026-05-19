export function sanitizeFileStem(input: string): string {
  const s = input
    .replaceAll(/[\\/:*?"<>|]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return s.length ? s : "untitled";
}

export function joinPosix(...parts: string[]): string {
  return parts
    .join("/")
    .replaceAll(/\/+/g, "/")
    .replaceAll(/^\/|\/$/g, "");
}

export function ensureMdExt(stem: string): string {
  return stem.toLowerCase().endsWith(".md") ? stem : `${stem}.md`;
}
