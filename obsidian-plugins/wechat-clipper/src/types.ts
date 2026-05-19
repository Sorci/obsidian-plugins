export type WeChatClipperPluginTypes = {
  version: string;
};

export type WeChatClipperSettings = {
  noteFolder: string;
  assetFolder: string;
  trimTailEnabled: boolean;
  trimTailKeywords: string[];
  userAgent: string;
};

export const DEFAULT_SETTINGS: WeChatClipperSettings = {
  noteFolder: "inbox/wechat",
  assetFolder: "assets/wechat",
  trimTailEnabled: true,
  trimTailKeywords: [
    "赞赏",
    "打赏",
    "推荐阅读",
    "阅读原文",
    "点击阅读原文",
    "长按识别二维码",
    "扫码关注",
    "关注公众号",
    "更多精彩内容"
  ],
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
};

export type WeChatArticleMeta = {
  url: string;
  title?: string;
  account?: string;
  author?: string;
  publishDate?: string;
};

export type WeChatExtracted = {
  meta: WeChatArticleMeta;
  contentEl: HTMLElement;
};

export type ImportWeChatResult = {
  notePath: string;
  imageTotal: number;
  imageFailed: number;
};
