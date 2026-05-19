import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import type { WeChatClipperSettings } from "./types";

export type WeChatClipperPluginSettingsHost = Plugin & {
  settings: WeChatClipperSettings;
  saveSettings: () => Promise<void>;
};

function parseKeywords(value: string): string[] {
  return value
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatKeywords(value: string[]): string {
  return value.join("\n");
}

export class WeChatClipperSettingTab extends PluginSettingTab {
  private readonly plugin: WeChatClipperPluginSettingsHost;

  constructor(app: App, plugin: WeChatClipperPluginSettingsHost) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("笔记保存路径")
      .setDesc("相对于 Vault 根目录的目标文件夹")
      .addText((text) =>
        text
          .setPlaceholder("inbox/wechat")
          .setValue(this.plugin.settings.noteFolder)
          .onChange(async (value) => {
            this.plugin.settings.noteFolder = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("资源保存路径")
      .setDesc("相对于 Vault 根目录的图片等资源文件夹")
      .addText((text) =>
        text
          .setPlaceholder("assets/wechat")
          .setValue(this.plugin.settings.assetFolder)
          .onChange(async (value) => {
            this.plugin.settings.assetFolder = value.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("自动裁剪尾部")
      .setDesc("导入时尝试移除“阅读原文”等尾部内容")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.trimTailEnabled).onChange(async (value) => {
          this.plugin.settings.trimTailEnabled = value;
          await this.plugin.saveSettings();
          this.display();
        }),
      );

    const keywordsSetting = new Setting(containerEl)
      .setName("尾部裁剪关键词")
      .setDesc("每行一个关键词，或用逗号分隔");

    const keywordsTextArea = document.createElement("textarea");
    keywordsTextArea.value = formatKeywords(this.plugin.settings.trimTailKeywords);
    keywordsTextArea.rows = 6;
    keywordsTextArea.style.width = "100%";
    keywordsTextArea.addEventListener("change", async () => {
      this.plugin.settings.trimTailKeywords = parseKeywords(keywordsTextArea.value);
      await this.plugin.saveSettings();
    });

    if (!this.plugin.settings.trimTailEnabled) {
      keywordsTextArea.disabled = true;
    }

    keywordsSetting.controlEl.appendChild(keywordsTextArea);

    new Setting(containerEl)
      .setName("User-Agent")
      .setDesc("抓取网页时使用的 User-Agent")
      .addTextArea((text) =>
        text.setValue(this.plugin.settings.userAgent).onChange(async (value) => {
          this.plugin.settings.userAgent = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
