export type CleanOptions = {
  trimTailEnabled: boolean;
  trimTailKeywords: string[];
};

const DEFAULT_REMOVE_SELECTORS = [
  ".qr_code_pc",
  ".reward_qrcode_area",
  ".reward_qrcode",
  ".rich_media_tool",
  ".share_media_tool",
  ".share_tool",
  ".js_profile_qrcode",
  ".profile_container",
  "mp-miniprogram"
];

export function cleanWeChatContent(contentEl: HTMLElement, opts: CleanOptions): void {
  for (const sel of DEFAULT_REMOVE_SELECTORS) {
    for (const el of Array.from(contentEl.querySelectorAll(sel))) {
      el.remove();
    }
  }

  if (!opts.trimTailEnabled) return;

  const keywords = opts.trimTailKeywords.map((s) => s.trim()).filter(Boolean);
  if (!keywords.length) return;

  const blocks = Array.from(contentEl.children) as HTMLElement[];
  for (let i = blocks.length - 1; i >= 0; i--) {
    const text = blocks[i].textContent?.trim() ?? "";
    if (!text) continue;
    if (keywords.some((k) => text.includes(k))) {
      for (let j = blocks.length - 1; j >= i; j--) {
        blocks[j].remove();
      }
      break;
    }
  }
}

