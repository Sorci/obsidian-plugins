import TurndownService from "turndown";

function escapeMarkdownAltText(input: string): string {
  return input.replaceAll("[", "\\[").replaceAll("]", "\\]");
}

export function htmlToMarkdown(contentEl: HTMLElement): string {
  const service = new TurndownService();

  service.addRule("wechat-image", {
    filter: "img",
    replacement(_content, node) {
      const img = node as HTMLImageElement;
      const src = img.getAttribute("data-src") ?? img.getAttribute("src") ?? "";
      if (!src) return "";
      const alt = escapeMarkdownAltText(img.getAttribute("alt") ?? "");
      return `![${alt}](${src})`;
    }
  });

  return service.turndown(contentEl);
}

