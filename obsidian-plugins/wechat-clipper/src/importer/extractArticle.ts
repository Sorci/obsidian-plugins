import type { WeChatExtracted } from "../types";
import { parseWeChatMeta } from "./parseMeta";

export function extractArticle(url: string, html: string): WeChatExtracted {
  const meta = parseWeChatMeta(url, html);
  const doc = new DOMParser().parseFromString(html, "text/html");
  const contentEl = doc.querySelector("#js_content");
  if (!contentEl) throw new Error("Article body not found: #js_content");
  return { meta, contentEl: contentEl as HTMLElement };
}
