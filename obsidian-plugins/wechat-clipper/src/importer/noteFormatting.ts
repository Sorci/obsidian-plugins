import type { AiArticleAnalysis, WeChatArticleMeta } from "../types";

export function composeWeChatNote(
  meta: WeChatArticleMeta,
  body: string,
  analysis: AiArticleAnalysis
): string {
  const lines: string[] = ["---", `source: ${meta.url}`];
  if (meta.title) lines.push(`title: "${escapeYamlString(meta.title)}"`);
  if (meta.account) lines.push(`account: "${escapeYamlString(meta.account)}"`);
  if (meta.author) lines.push(`author: "${escapeYamlString(meta.author)}"`);
  if (meta.publishDate) lines.push(`publish_time: ${meta.publishDate}`);

  if (analysis.topic) lines.push(`topic: "${escapeYamlString(analysis.topic)}"`);
  if (analysis.tags && analysis.tags.length > 0) {
    lines.push("tags:");
    for (const t of analysis.tags) {
      lines.push(`  - ${t}`);
    }
  }

  lines.push("---", "", "");

  const aiBlock = analysis.summary ? formatAiSummaryCallout(analysis.summary) : "";
  return lines.join("\n") + aiBlock + body.trimEnd() + "\n";
}

export function formatAiSummaryCallout(summary: string): string {
  const normalized = summary.trim().replaceAll(/\r\n/g, "\n");
  const parts = normalized
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const outLines = ["> [!summary] AI 总结", ...parts.map((p) => `> ${p}`), ""];
  return outLines.join("\n") + "\n";
}

function escapeYamlString(s: string): string {
  return s.replaceAll(/"/g, '\\"');
}
