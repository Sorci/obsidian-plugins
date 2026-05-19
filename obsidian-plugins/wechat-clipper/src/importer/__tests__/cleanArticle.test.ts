import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it } from "vitest";
import { cleanWeChatContent } from "../cleanArticle";

beforeEach(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  (globalThis as any).DOMParser = dom.window.DOMParser;
});

describe("cleanWeChatContent", () => {
  it("trims tail blocks after matching keyword", () => {
    const doc = new DOMParser().parseFromString(
      `<div id="js_content">
        <p>a</p>
        <p>b</p>
        <p>赞赏</p>
        <p>c</p>
      </div>`,
      "text/html"
    );
    const el = doc.querySelector("#js_content") as unknown as HTMLElement;
    cleanWeChatContent(el, { trimTailEnabled: true, trimTailKeywords: ["赞赏"] });
    expect(el.textContent?.replaceAll(/\s+/g, "")).toBe("ab");
  });

  it("does nothing when disabled", () => {
    const doc = new DOMParser().parseFromString(
      `<div id="js_content"><p>a</p><p>赞赏</p></div>`,
      "text/html"
    );
    const el = doc.querySelector("#js_content") as unknown as HTMLElement;
    cleanWeChatContent(el, { trimTailEnabled: false, trimTailKeywords: ["赞赏"] });
    expect(el.textContent?.replaceAll(/\s+/g, "")).toBe("a赞赏");
  });
});

