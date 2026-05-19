import { Modal, Notice, Plugin, Setting } from "obsidian";
import { WeChatClipperSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type WeChatClipperSettings } from "./types";
import { importWeChatArticle } from "./importer/importWeChatArticle";

export default class WeChatClipperPlugin extends Plugin {
  settings: WeChatClipperSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new WeChatClipperSettingTab(this.app, this));

    this.addCommand({
      id: "import-wechat-article-from-url",
      name: "Import WeChat Article from URL",
      callback: async () => {
        const url = await new UrlInputModal(this).openAndGet();
        if (!url) return;
        await this.runImport(url);
      }
    });
  }

  async loadSettings(): Promise<void> {
    const loaded = (await this.loadData()) as Partial<WeChatClipperSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(loaded ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async runImport(url: string): Promise<void> {
    try {
      const out = await importWeChatArticle({ app: this.app, url, settings: this.settings });
      const msg =
        out.imageFailed > 0
          ? `Imported: ${out.notePath} (images: ${out.imageTotal}, failed: ${out.imageFailed})`
          : `Imported: ${out.notePath} (images: ${out.imageTotal})`;
      new Notice(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`Import failed: ${msg}`);
    }
  }
}

class UrlInputModal extends Modal {
  private readonly plugin: WeChatClipperPlugin;
  private resolve?: (value: string | null) => void;
  private value = "";

  constructor(plugin: WeChatClipperPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  openAndGet(): Promise<string | null> {
    this.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "WeChat Article URL" });

    new Setting(contentEl).addText((text) =>
      text.setPlaceholder("https://mp.weixin.qq.com/s/...").onChange((v) => {
        this.value = v.trim();
      })
    );

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Import").setCta().onClick(() => {
        this.close();
        this.resolve?.(this.value || null);
      })
    );
  }

  onClose(): void {
    this.resolve?.(this.value || null);
  }
}
