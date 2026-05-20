import { requestUrl } from "obsidian";
import type { AiArticleAnalysis, AiLanguage, WeChatClipperSettings } from "../types";

export function parseJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeAiAnalysis(
  raw: Record<string, unknown>,
  opts: { maxTags: number; maxSummaryChars: number }
): AiArticleAnalysis {
  const topic = typeof raw.topic === "string" ? raw.topic.trim() : "";

  const tagsRaw = Array.isArray(raw.tags) ? raw.tags : [];
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const t of tagsRaw) {
    if (typeof t !== "string") continue;
    const normalized = t.trim().replace(/^#+/g, "");
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    tags.push(normalized);
    if (tags.length >= opts.maxTags) break;
  }

  const summary = typeof raw.summary === "string" ? raw.summary.trim() : "";

  return {
    topic: topic ? topic : undefined,
    tags: tags.length > 0 ? tags : undefined,
    summary: summary ? summary.slice(0, opts.maxSummaryChars) : undefined
  };
}

export function hasAiConfig(settings: WeChatClipperSettings): boolean {
  return Boolean(
    settings.aiEnabled &&
      settings.aiBaseUrl.trim() &&
      settings.aiApiKey.trim() &&
      settings.aiModel.trim()
  );
}

function buildChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replaceAll(/\/+$/g, "");
  const marker = "/chat/completions";
  const idx = trimmed.indexOf(marker);
  if (idx !== -1) return trimmed.slice(0, idx + marker.length);
  if (trimmed.endsWith("/v1")) return `${trimmed}${marker}`;
  return `${trimmed}/v1${marker}`;
}

function languageHint(lang: AiLanguage): string {
  if (lang === "zh") return "用中文输出。";
  if (lang === "en") return "Output in English.";
  return "";
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return p;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("AI request timeout")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function analyzeArticleWithOpenAICompatible(args: {
  title: string;
  markdown: string;
  settings: WeChatClipperSettings;
}): Promise<AiArticleAnalysis> {
  const { settings } = args;
  if (!hasAiConfig(settings)) return {};

  const url = buildChatCompletionsUrl(settings.aiBaseUrl);
  const input = args.markdown.slice(0, settings.aiMaxInputChars);

  const system = [
    "You are an assistant that extracts topic/tags/summary from an article.",
    "Return ONLY valid JSON (no markdown, no code fence).",
    `Schema: {"topic":"string","tags":["string"],"summary":"string"}.`,
    `Constraints: tags length <= ${settings.aiMaxTags}; summary <= ${settings.aiSummaryMaxChars} chars.`,
    languageHint(settings.aiLanguage)
  ]
    .filter(Boolean)
    .join(" ");

  const req = requestUrl({
    url,
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${settings.aiApiKey.trim()}`
    },
    body: JSON.stringify({
      model: settings.aiModel.trim(),
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Title: ${args.title}\n\nContent:\n${input}` }
      ]
    })
  } as any);

  const res = await withTimeout(req, settings.aiRequestTimeoutMs);
  const content = (res as any)?.json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return {};

  const parsed = parseJsonObject(content);
  if (!parsed) return {};

  return normalizeAiAnalysis(parsed, {
    maxTags: settings.aiMaxTags,
    maxSummaryChars: settings.aiSummaryMaxChars
  });
}

