import type { WeChatArticleMeta } from "../types";

export function parseWeChatMeta(url: string, html: string): WeChatArticleMeta {
  const meta: WeChatArticleMeta = { url };

  const ogTitle = html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (ogTitle) meta.title = decodeHtmlEntities(ogTitle.trim());

  const publishTs = html.match(/\bvar\s+ct\s*=\s*['"](\d{10})['"]/i)?.[1];
  if (publishTs) meta.publishDate = new Date(Number(publishTs) * 1000).toISOString().slice(0, 10);

  return meta;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replaceAll(/&amp;/g, "&")
    .replaceAll(/&lt;/g, "<")
    .replaceAll(/&gt;/g, ">")
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&#39;/g, "'");
}
