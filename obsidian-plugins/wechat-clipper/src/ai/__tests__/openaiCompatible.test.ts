import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => {
  return {
    requestUrl: vi.fn()
  };
});

import { requestUrl } from "obsidian";
import type { WeChatClipperSettings } from "../../types";
import {
  analyzeArticleWithOpenAICompatible,
  normalizeAiAnalysis,
  parseJsonObject
} from "../openaiCompatible";

function createSettings(overrides: Partial<WeChatClipperSettings> = {}): WeChatClipperSettings {
  return {
    noteFolder: "",
    assetFolder: "",
    trimTailEnabled: true,
    trimTailKeywords: [],
    userAgent: "",
    aiEnabled: true,
    aiBaseUrl: "https://api.example.com",
    aiApiKey: "k",
    aiModel: "m",
    aiRequestTimeoutMs: 30000,
    aiMaxInputChars: 60000,
    aiSummaryMaxChars: 150,
    aiMaxTags: 8,
    aiLanguage: "auto",
    ...overrides
  };
}

describe("parseJsonObject", () => {
  it("parses strict JSON object", () => {
    const obj = parseJsonObject(`{"topic":"t","tags":["a"],"summary":"s"}`);
    expect(obj).toEqual({ topic: "t", tags: ["a"], summary: "s" });
  });

  it("returns null on non JSON object", () => {
    const obj = parseJsonObject("hello");
    expect(obj).toBeNull();
  });
});

describe("normalizeAiAnalysis", () => {
  it("trims topic/tags/summary and clamps", () => {
    const out = normalizeAiAnalysis(
      { topic: "  主题  ", tags: [" #a ", "b", "b", ""], summary: "x".repeat(1000) },
      { maxTags: 2, maxSummaryChars: 10 }
    );

    expect(out.topic).toBe("主题");
    expect(out.tags).toEqual(["a", "b"]);
    expect(out.summary).toBe("x".repeat(10));
  });
});

describe("analyzeArticleWithOpenAICompatible", () => {
  it("builds url from base root", async () => {
    vi.mocked(requestUrl).mockResolvedValueOnce({
      json: {
        choices: [{ message: { content: `{"topic":"t","tags":["a"],"summary":"s"}` } }]
      }
    } as any);

    await analyzeArticleWithOpenAICompatible({
      title: "t",
      markdown: "body",
      settings: createSettings({ aiBaseUrl: "https://api.example.com" })
    });

    expect(vi.mocked(requestUrl)).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.com/v1/chat/completions",
        method: "POST"
      })
    );
  });

  it("builds url from base /v1", async () => {
    vi.mocked(requestUrl).mockResolvedValueOnce({
      json: {
        choices: [{ message: { content: `{"topic":"t","tags":["a"],"summary":"s"}` } }]
      }
    } as any);

    await analyzeArticleWithOpenAICompatible({
      title: "t",
      markdown: "body",
      settings: createSettings({ aiBaseUrl: "https://api.example.com/v1/" })
    });

    expect(vi.mocked(requestUrl)).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.com/v1/chat/completions",
        method: "POST"
      })
    );
  });

  it("uses baseUrl directly when it contains /chat/completions", async () => {
    vi.mocked(requestUrl).mockResolvedValueOnce({
      json: {
        choices: [{ message: { content: `{"topic":"t","tags":["a"],"summary":"s"}` } }]
      }
    } as any);

    await analyzeArticleWithOpenAICompatible({
      title: "t",
      markdown: "body",
      settings: createSettings({ aiBaseUrl: "https://api.example.com/v1/chat/completions/" })
    });

    expect(vi.mocked(requestUrl)).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.com/v1/chat/completions",
        method: "POST"
      })
    );
  });
});

