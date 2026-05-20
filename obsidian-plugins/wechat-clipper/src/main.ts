import { Modal, Notice, Plugin, Setting } from "obsidian";
import { WeChatClipperSettingTab } from "./settings";
import { DEFAULT_SETTINGS, type AiStatus, type WeChatClipperSettings } from "./types";
import { importWeChatArticle } from "./importer/importWeChatArticle";
import { bindEnterSubmit } from "./ui/bindEnterSubmit";

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
      const ai = formatAiStatus(out.aiStatus);
      const msg =
        out.imageFailed > 0
          ? `Imported: ${out.notePath} (images: ${out.imageTotal}, failed: ${out.imageFailed}${ai})`
          : `Imported: ${out.notePath} (images: ${out.imageTotal}${ai})`;
      new Notice(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`Import failed: ${msg}`);
    }
  }
}

function formatAiStatus(aiStatus: AiStatus | undefined): string {
  if (!aiStatus || aiStatus === "skipped") return "";
  if (aiStatus === "missing_config") return ", AI: missing config";
  return `, AI: ${aiStatus}`;
}

class UrlInputModal extends Modal {
  private readonly plugin: WeChatClipperPlugin;
  private resolve?: (value: string | null) => void;
  private value = "";
  private isResolved = false;
  private unbindEnter?: () => void;

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

    this.isResolved = false;
    this.value = "";

    const urlSetting = new Setting(contentEl);
    urlSetting.infoEl.remove();
    urlSetting.controlEl.style.width = "100%";
    urlSetting.controlEl.style.justifyContent = "flex-start";
    urlSetting.addText((text) => {
      text.setPlaceholder("https://mp.weixin.qq.com/s/...").onChange((v) => {
        this.value = v.trim();
      });
      text.inputEl.style.width = "100%";
      text.inputEl.style.maxWidth = "100%";
      this.unbindEnter = bindEnterSubmit(text.inputEl, () => this.submit());
      queueMicrotask(() => text.inputEl.focus());
    });

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Import").setCta().onClick(() => {
        this.submit();
      })
    );
  }

  onClose(): void {
    this.unbindEnter?.();
    this.unbindEnter = undefined;
    this.finish(this.value || null);
  }

  private submit(): void {
    this.finish(this.value || null);
    this.close();
  }

  private finish(value: string | null): void {
    if (this.isResolved) return;
    this.isResolved = true;
    const resolve = this.resolve;
    this.resolve = undefined;
    resolve?.(value);
  }
}
