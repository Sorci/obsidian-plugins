import { describe, expect, it } from "vitest";
import { composeWeChatNote } from "../noteFormatting";

describe("composeWeChatNote", () => {
  it("writes topic/tags into yaml and inserts ai summary callout after frontmatter", () => {
    const out = composeWeChatNote(
      { url: "u", title: "t", publishDate: "2026-01-01" },
      "BODY\n",
      { topic: "topic", tags: ["a", "b"], summary: "sum" }
    );

    expect(out).toContain("source: u");
    expect(out).toContain('title: "t"');
    expect(out).toContain("publish_time: 2026-01-01");
    expect(out).toContain('topic: "topic"');
    expect(out).toContain("tags:\n  - a\n  - b\n");
    expect(out).toContain("---\n\n> [!summary] AI 总结\n> sum\n\nBODY\n");
  });

  it("omits ai fields when analysis is empty", () => {
    const out = composeWeChatNote({ url: "u" }, "BODY\n", {});
    expect(out).not.toContain("topic:");
    expect(out).not.toContain("\n> [!summary]");
  });
});

