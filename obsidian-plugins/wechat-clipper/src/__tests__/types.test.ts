import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, type AiLanguage } from "../types";

describe("types", () => {
  it("DEFAULT_SETTINGS includes AI defaults", () => {
    expect(DEFAULT_SETTINGS.aiEnabled).toBe(false);
    expect(DEFAULT_SETTINGS.aiBaseUrl).toBe("");
    expect(DEFAULT_SETTINGS.aiApiKey).toBe("");
    expect(DEFAULT_SETTINGS.aiModel).toBe("gpt-4o-mini");
    expect(DEFAULT_SETTINGS.aiRequestTimeoutMs).toBe(30000);
    expect(DEFAULT_SETTINGS.aiMaxInputChars).toBe(60000);
    expect(DEFAULT_SETTINGS.aiSummaryMaxChars).toBe(150);
    expect(DEFAULT_SETTINGS.aiMaxTags).toBe(8);
    expect(DEFAULT_SETTINGS.aiLanguage).toBe("auto");
  });

  it("AiLanguage supports auto/zh/en", () => {
    const a: AiLanguage = "auto";
    const b: AiLanguage = "zh";
    const c: AiLanguage = "en";

    expect([a, b, c]).toEqual(["auto", "zh", "en"]);
  });
});
