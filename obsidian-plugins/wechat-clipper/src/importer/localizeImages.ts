import { joinPosix } from "./pathing";

export type VaultLike = {
  getAbstractFileByPath(path: string): unknown | null;
  createFolder(path: string): Promise<unknown>;
  createBinary(path: string, data: ArrayBuffer): Promise<unknown>;
  adapter?: {
    writeBinary(path: string, data: ArrayBuffer): Promise<void>;
  };
};

export type RequestUrlLikeResponse = {
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
};

export type RequestUrlLike = (req: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
}) => Promise<RequestUrlLikeResponse>;

export type LocalizeImagesParams = {
  vault: VaultLike;
  markdown: string;
  noteFolder: string;
  assetFolder: string;
  noteStem: string;
  referer: string;
  userAgent: string;
  requestUrl: RequestUrlLike;
};

export type LocalizeImagesResult = {
  markdown: string;
  imageTotal: number;
  imageFailed: number;
};

const MARKDOWN_IMAGE_RE = /!\[[^\]]*]\(\s*(<[^>]+>|[^)\s]+)(\s+(?:(?:"[^"]*")|(?:'[^']*')))?\s*\)/g;

export async function ensureFolder(vault: VaultLike, folderPath: string): Promise<void> {
  const parts = joinPosix(folderPath).split("/").filter(Boolean);
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    if (vault.getAbstractFileByPath(acc)) continue;
    try {
      await vault.createFolder(acc);
    } catch {
      if (!vault.getAbstractFileByPath(acc)) throw new Error(`Failed to create folder: ${acc}`);
    }
  }
}

export async function localizeImages(params: LocalizeImagesParams): Promise<LocalizeImagesResult> {
  const { vault, markdown, noteFolder, assetFolder, noteStem, referer, userAgent } = params;
  const request = params.requestUrl;
  const matches = Array.from(markdown.matchAll(MARKDOWN_IMAGE_RE));

  const urls: string[] = [];
  for (const m of matches) {
    const raw = m[1] ?? "";
    const url = unwrapAngle(raw).trim();
    if (!isHttpUrl(url)) continue;
    if (!urls.includes(url)) urls.push(url);
  }

  const assetDir = joinPosix(assetFolder, noteStem);
  await ensureFolder(vault, assetDir);

  const usedNames = new Set<string>();
  const rewrites = new Map<string, string>();
  let imageFailed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const res = await request({
        url,
        method: "GET",
        headers: {
          Referer: referer,
          "User-Agent": userAgent
        }
      });
      const contentType = getHeader(res.headers, "content-type");
      const fileName = makeUniqueFileName(resolveFileName(url, contentType, i + 1), usedNames);
      const targetPath = joinPosix(assetDir, fileName);
      await writeBinary(vault, targetPath, res.arrayBuffer);
      const rel = relativePosix(joinPosix(noteFolder), targetPath);
      rewrites.set(url, rel);
    } catch {
      imageFailed += 1;
    }
  }

  const out = markdown.replaceAll(MARKDOWN_IMAGE_RE, (full, rawUrl: string) => {
    const url = unwrapAngle(String(rawUrl)).trim();
    const rel = rewrites.get(url);
    if (!rel) return full;
    const wrapped = isAngleWrapped(String(rawUrl)) ? `<${rel}>` : rel;
    return full.replace(String(rawUrl), wrapped);
  });

  return { markdown: out, imageTotal: urls.length, imageFailed };
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function isAngleWrapped(token: string): boolean {
  return token.startsWith("<") && token.endsWith(">");
}

function unwrapAngle(token: string): string {
  return isAngleWrapped(token) ? token.slice(1, -1) : token;
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const needle = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === needle) return v;
  }
  return undefined;
}

function resolveFileName(url: string, contentType: string | undefined, index: number): string {
  const parsed = safeUrl(url);
  const pathname = parsed?.pathname ?? "";
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  const base = sanitizeFileName(safeDecodeURIComponent(last)) || `image-${index}`;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot + 1) : "";
  const finalExt = ext || extFromContentType(contentType) || "bin";
  return `${stem}.${finalExt}`;
}

function extFromContentType(contentType: string | undefined): string | undefined {
  const v = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (v === "image/png") return "png";
  if (v === "image/jpeg") return "jpg";
  if (v === "image/jpg") return "jpg";
  if (v === "image/gif") return "gif";
  if (v === "image/webp") return "webp";
  if (v === "image/svg+xml") return "svg";
  return undefined;
}

function makeUniqueFileName(name: string, used: Set<string>): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let out = `${stem}${ext}`;
  let n = 2;
  while (used.has(out)) {
    out = `${stem}-${n}${ext}`;
    n += 1;
  }
  used.add(out);
  return out;
}

function sanitizeFileName(input: string): string {
  const s = input
    .replaceAll(/[\\/:*?"<>|]/g, "-")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^\.+/g, "")
    .replaceAll(/\.+$/g, "")
    .trim();
  return s;
}

function safeDecodeURIComponent(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

function safeUrl(input: string): URL | undefined {
  try {
    return new URL(input);
  } catch {
    return undefined;
  }
}

async function writeBinary(vault: VaultLike, path: string, data: ArrayBuffer): Promise<void> {
  try {
    await vault.createBinary(path, data);
  } catch {
    const adapter = (vault as any).adapter;
    const writeBinaryFn = adapter?.writeBinary as undefined | ((p: string, d: ArrayBuffer) => Promise<void>);
    if (writeBinaryFn) {
      await writeBinaryFn.call(adapter, path, data);
      return;
    }
    throw new Error(`Failed to write binary: ${path}`);
  }
}

function relativePosix(fromDir: string, toPath: string): string {
  const from = joinPosix(fromDir).split("/").filter(Boolean);
  const to = joinPosix(toPath).split("/").filter(Boolean);

  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i += 1;

  const up = from.length - i;
  const parts: string[] = [];
  for (let j = 0; j < up; j++) parts.push("..");
  parts.push(...to.slice(i));

  return parts.length ? parts.join("/") : ".";
}
