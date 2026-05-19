import { describe, expect, it } from "vitest";
import { parseWeChatMeta } from "../parseMeta";

describe("parseWeChatMeta", () => {
  it("parses og:title and ct publish timestamp", () => {
    const html = `
      <meta property="og:title" content="Hello &amp; World" />
      <script>var ct = "1710000000";</script>
    `;
    const meta = parseWeChatMeta("https://example.com", html);
    expect(meta.title).toBe("Hello & World");
    expect(meta.publishDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
