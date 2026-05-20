import { describe, expect, it } from "vitest";
import { decideAiStatus } from "../aiStatus";

const base = {
  noteFolder: "",
  assetFolder: "",
  trimTailEnabled: true,
  trimTailKeywords: [],
  userAgent: "",
  aiEnabled: true,
  aiBaseUrl: "https://api.openai.com",
  aiApiKey: "k",
  aiModel: "m",
  aiRequestTimeoutMs: 1,
  aiMaxInputChars: 1,
  aiSummaryMaxChars: 1,
  aiMaxTags: 1,
  aiLanguage: "auto"
} as any;

describe("decideAiStatus", () => {
  it("returns skipped when disabled", () => {
    expect(decideAiStatus({ ...base, aiEnabled: false }, {}, false)).toBe("skipped");
  });

  it("returns missing_config when enabled but config missing", () => {
    expect(decideAiStatus({ ...base, aiApiKey: "" }, {}, false)).toBe("missing_config");
  });

  it("returns failed when aiError is true", () => {
    expect(decideAiStatus(base, {}, true)).toBe("failed");
  });

  it("returns ok when analysis has any field", () => {
    expect(decideAiStatus(base, { topic: "t" }, false)).toBe("ok");
    expect(decideAiStatus(base, { summary: "s" }, false)).toBe("ok");
    expect(decideAiStatus(base, { tags: ["a"] }, false)).toBe("ok");
  });

  it("returns failed when no error but analysis is empty", () => {
    expect(decideAiStatus(base, {}, false)).toBe("failed");
  });
});
