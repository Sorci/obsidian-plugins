import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { extractArticle } from "../extractArticle";

describe("extractArticle", () => {
  it("extracts #js_content as article body and parses basic meta", () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    globalThis.DOMParser = dom.window.DOMParser as unknown as typeof DOMParser;

    const url = "https://mp.weixin.qq.com/s/someid";
    const html = `
      <meta property="og:title" content="Hello &amp; World" />
      <script>var ct = "1710000000";</script>
      <div id="js_content"><p>hi</p></div>
    `;

    const extracted = extractArticle(url, html);
    expect(extracted.meta.url).toBe(url);
    expect(extracted.meta.title).toBe("Hello & World");
    expect(extracted.contentEl.id).toBe("js_content");
    expect(extracted.contentEl.textContent?.trim()).toBe("hi");
  });
});
