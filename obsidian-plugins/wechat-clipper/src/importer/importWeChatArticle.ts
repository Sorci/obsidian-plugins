import { requestUrl, type App } from "obsidian";
import type { ImportWeChatResult, WeChatArticleMeta, WeChatClipperSettings } from "../types";
import { cleanWeChatContent } from "./cleanArticle";
import { extractArticle } from "./extractArticle";
import { fetchHtml } from "./fetchHtml";
import { htmlToMarkdown } from "./htmlToMarkdown";
import { localizeImages } from "./localizeImages";
import { ensureMdExt, joinPosix, sanitizeFileStem } from "./pathing";

export async function importWeChatArticle(args: {
  app: App;
  url: string;
  settings: WeChatClipperSettings;
}): Promise<ImportWeChatResult> {
  const html = await fetchHtml(args.url, args.settings.userAgent);
  const extracted = extractArticle(args.url, html);

  cleanWeChatContent(extracted.contentEl, {
    trimTailEnabled: args.settings.trimTailEnabled,
    trimTailKeywords: args.settings.trimTailKeywords
  });

  const title = extracted.meta.title ?? "untitled";
  const noteStem = sanitizeFileStem(title);
  const mdBody = htmlToMarkdown(extracted.contentEl);

  const localized = await localizeImages({
    vault: args.app.vault as any,
    markdown: mdBody,
    noteFolder: args.settings.noteFolder,
    assetFolder: args.settings.assetFolder,
    noteStem,
    referer: args.url,
    userAgent: args.settings.userAgent,
    requestUrl: async (req) => {
      const res = await requestUrl(req as any);
      return {
        headers: res.headers as Record<string, string>,
        arrayBuffer: res.arrayBuffer
      };
    }
  });

  const notePath = await writeNote(args.app, {
    folder: args.settings.noteFolder,
    stem: noteStem,
    publishDate: extracted.meta.publishDate,
    content: withFrontmatter(extracted.meta, localized.markdown)
  });

  return { notePath, imageTotal: localized.imageTotal, imageFailed: localized.imageFailed };
}

function withFrontmatter(meta: WeChatArticleMeta, body: string): string {
  const lines: string[] = ["---", `source: ${meta.url}`];
  if (meta.title) lines.push(`title: "${escapeYamlString(meta.title)}"`);
  if (meta.account) lines.push(`account: "${escapeYamlString(meta.account)}"`);
  if (meta.author) lines.push(`author: "${escapeYamlString(meta.author)}"`);
  if (meta.publishDate) lines.push(`publish_time: ${meta.publishDate}`);
  lines.push("---", "");
  return lines.join("\n") + body.trimEnd() + "\n";
}

function escapeYamlString(s: string): string {
  return s.replaceAll(/"/g, '\\"');
}

async function writeNote(
  app: App,
  input: { folder: string; stem: string; publishDate?: string; content: string }
): Promise<string> {
  const folder = input.folder.trim().replaceAll(/\/+$/g, "");
  if (folder) await ensureFolder(app, folder);

  const baseName = ensureMdExt(input.stem);
  const basePath = folder ? joinPosix(folder, baseName) : baseName;
  const existing = app.vault.getAbstractFileByPath(basePath);
  if (!existing) {
    await app.vault.create(basePath, input.content);
    return basePath;
  }

  const suffix = input.publishDate ?? new Date().toISOString().slice(0, 10);
  const altName = ensureMdExt(`${input.stem} - ${suffix}`);
  const altPath = folder ? joinPosix(folder, altName) : altName;
  await app.vault.create(altPath, input.content);
  return altPath;
}

async function ensureFolder(app: App, folderPath: string): Promise<void> {
  const parts = joinPosix(folderPath).split("/").filter(Boolean);
  let acc = "";
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    if (app.vault.getAbstractFileByPath(acc)) continue;
    await app.vault.createFolder(acc);
  }
}

