import { describe, expect, it } from "vitest";

function makeVault() {
  const files = new Map<string, ArrayBuffer>();
  const folders = new Set<string>();
  return {
    getAbstractFileByPath: (p: string) => (folders.has(p) ? ({ path: p } as any) : null),
    createFolder: async (p: string) => {
      if (folders.has(p)) throw new Error("exists");
      folders.add(p);
      return { path: p } as any;
    },
    createBinary: async (p: string, data: ArrayBuffer) => {
      files.set(p, data);
      return { path: p } as any;
    }
  };
}

describe("localizeImages", () => {
  it("downloads images and rewrites markdown links to relative paths from note folder", async () => {
    const vault = makeVault();
    const noteFolder = "inbox/wechat";
    const assetFolder = "assets/wechat";
    const noteStem = "hello";

    const input = "a\n![](https://example.com/a.png)\n";
    const { localizeImages } = await import("../localizeImages");
    const out = await localizeImages({
      vault: vault as any,
      markdown: input,
      noteFolder,
      assetFolder,
      noteStem,
      referer: "https://mp.weixin.qq.com/s/xx",
      userAgent: "UA",
      requestUrl: async () => ({
        headers: { "content-type": "image/png" },
        arrayBuffer: new ArrayBuffer(3)
      })
    });

    expect(out.imageTotal).toBe(1);
    expect(out.imageFailed).toBe(0);
    expect(out.markdown).toContain("![](../../assets/wechat/hello/a.png)");
  });

  it("keeps original url when download fails and increments failed", async () => {
    const vault = makeVault();
    const { localizeImages } = await import("../localizeImages");
    const out = await localizeImages({
      vault: vault as any,
      markdown: "![](https://example.com/b.png)\n",
      noteFolder: "inbox/wechat",
      assetFolder: "assets/wechat",
      noteStem: "hello",
      referer: "https://mp.weixin.qq.com/s/xx",
      userAgent: "UA",
      requestUrl: async () => {
        throw new Error("net");
      }
    });

    expect(out.imageTotal).toBe(1);
    expect(out.imageFailed).toBe(1);
    expect(out.markdown).toBe("![](https://example.com/b.png)\n");
  });
});
