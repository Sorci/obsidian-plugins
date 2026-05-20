import type { AiArticleAnalysis, AiStatus, WeChatClipperSettings } from "../types";
import { hasAiConfig } from "../ai/openaiCompatible";

export function decideAiStatus(
  settings: WeChatClipperSettings,
  analysis: AiArticleAnalysis,
  aiError: boolean
): AiStatus {
  if (!settings.aiEnabled) return "skipped";
  if (!hasAiConfig(settings)) return "missing_config";
  if (aiError) return "failed";
  if (analysis.topic) return "ok";
  if (analysis.summary) return "ok";
  if (analysis.tags && analysis.tags.length > 0) return "ok";
  return "failed";
}
